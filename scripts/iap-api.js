/**
 * Store IAP verify + Apple/Google notification webhooks.
 * Activates the same user_profiles.subscription_* fields as Razorpay.
 * Without store credentials, verify returns 503 (does not fake-activate).
 */
import crypto from 'crypto'
import { getAuthUser, adminAuth, getPbUrl } from './pb-admin.js'
import { activateSubscription, expireSubscription } from './subscription-activate.js'

function allowedProducts() {
  const raw = process.env.IAP_PRODUCT_IDS || process.env.IAP_PRODUCT_PREMIUM || ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

function isAppleConfigured() {
  return Boolean(process.env.APPLE_SHARED_SECRET || process.env.APPLE_IAP_ISSUER_ID)
}

function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_PLAY_PACKAGE_NAME && process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON)
}

export function isIapReady() {
  return allowedProducts().size > 0 && (isAppleConfigured() || isGoogleConfigured())
}

async function findPaymentEventById(eventId) {
  const token = await adminAuth()
  if (!token) return null
  const pb = getPbUrl()
  const filter = encodeURIComponent(`event_id="${String(eventId).replace(/"/g, '')}"`)
  const res = await fetch(`${pb}/api/collections/payment_events/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: token },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] || null
}

async function writePaymentEvent(row) {
  const token = await adminAuth()
  if (!token) throw new Error('Admin auth unavailable')
  const pb = getPbUrl()
  const res = await fetch(`${pb}/api/collections/payment_events/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`payment_events write failed: ${err || res.status}`)
  }
  return res.json()
}

/** Apple legacy verifyReceipt — works when APPLE_SHARED_SECRET is set. */
async function verifyAppleReceipt(receiptData, productId) {
  const secret = process.env.APPLE_SHARED_SECRET
  if (!secret) throw new Error('APPLE_SHARED_SECRET not set')

  const body = JSON.stringify({
    'receipt-data': receiptData,
    password: secret,
    'exclude-old-transactions': true,
  })

  async function call(url) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    return res.json()
  }

  let data = await call('https://buy.itunes.apple.com/verifyReceipt')
  // 21007 = sandbox receipt sent to production
  if (data.status === 21007) {
    data = await call('https://sandbox.itunes.apple.com/verifyReceipt')
  }
  if (data.status !== 0) {
    throw new Error(`Apple verifyReceipt status ${data.status}`)
  }

  const latest = data.latest_receipt_info || data.receipt?.in_app || []
  const match = latest.find((t) => t.product_id === productId) || latest[latest.length - 1]
  if (!match) throw new Error('No matching Apple transaction')
  if (productId && match.product_id !== productId) {
    throw new Error(`Product mismatch: ${match.product_id}`)
  }
  return {
    transactionId: String(match.transaction_id || match.original_transaction_id),
    productId: match.product_id,
    raw: data,
  }
}

/** Google Play purchaseToken verify via Android Publisher API (service account JWT). */
async function verifyGooglePurchase(packageName, productId, purchaseToken) {
  const saRaw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
  if (!saRaw) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not set')
  const sa = typeof saRaw === 'string' && saRaw.trim().startsWith('{') ? JSON.parse(saRaw) : null
  if (!sa?.client_email || !sa?.private_key) {
    throw new Error('Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url')
  const unsigned = `${header}.${claim}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(unsigned)
  const signature = sign.sign(sa.private_key, 'base64url')
  const jwt = `${unsigned}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error('Google OAuth token failed')

  // Prefer subscription endpoint; fall back to products
  const subUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`
  let res = await fetch(subUrl, { headers: { Authorization: `Bearer ${tokenData.access_token}` } })
  if (res.status === 404) {
    const prodUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`
    res = await fetch(prodUrl, { headers: { Authorization: `Bearer ${tokenData.access_token}` } })
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error?.message || `Google verify failed (${res.status})`)

  // purchaseState 0 = purchased; subscription paymentState 1 = received
  if (data.purchaseState != null && data.purchaseState !== 0) {
    throw new Error('Google purchase not completed')
  }
  return {
    transactionId: String(data.orderId || purchaseToken),
    productId,
    raw: data,
  }
}

export async function handleIapApi(req, res, pathname, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (pathname === '/api/iap/verify' && req.method === 'POST') {
    const auth = req.headers.authorization
    if (!auth) return json(res, 401, { error: 'Login required' })
    const user = await getAuthUser(auth)
    if (!user?.id) return json(res, 401, { error: 'Invalid or expired session' })

    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }

    const platform = String(body.platform || '').toLowerCase()
    const productId = String(body.productId || '').trim()
    const country = String(body.country || '').trim().toUpperCase() || undefined
    const products = allowedProducts()

    if (!productId || (products.size > 0 && !products.has(productId))) {
      return json(res, 400, { error: 'Unknown or missing productId' })
    }
    if (products.size === 0) {
      return json(res, 503, { error: 'IAP products not configured (set IAP_PRODUCT_IDS)' })
    }

    try {
      let verified
      if (platform === 'ios' || platform === 'apple') {
        if (!isAppleConfigured()) return json(res, 503, { error: 'Apple IAP not configured' })
        const receipt = String(body.receipt || body.transactionReceipt || '').trim()
        if (!receipt) return json(res, 400, { error: 'receipt required' })
        verified = await verifyAppleReceipt(receipt, productId)
      } else if (platform === 'android' || platform === 'google') {
        if (!isGoogleConfigured()) return json(res, 503, { error: 'Google Play IAP not configured' })
        const purchaseToken = String(body.purchaseToken || body.token || '').trim()
        if (!purchaseToken) return json(res, 400, { error: 'purchaseToken required' })
        verified = await verifyGooglePurchase(
          process.env.GOOGLE_PLAY_PACKAGE_NAME,
          productId,
          purchaseToken
        )
      } else {
        return json(res, 400, { error: 'platform must be ios or android' })
      }

      const eventId = `iap_${platform}_${verified.transactionId}`
      const existing = await findPaymentEventById(eventId)
      if (existing) {
        return json(res, 200, { success: true, already: true })
      }

      await writePaymentEvent({
        event_id: eventId,
        event: 'iap.verify',
        payment_id: verified.transactionId,
        order_id: verified.transactionId,
        status: 'captured',
        method: platform === 'ios' || platform === 'apple' ? 'apple' : 'google',
        user: user.id,
        notes: { productId: verified.productId, country },
        payload: { verified: true },
      })

      await activateSubscription(user.id, country)
      return json(res, 200, { success: true })
    } catch (err) {
      console.error('[iap/verify]', err.message)
      return json(res, 400, { error: err.message || 'IAP verification failed' })
    }
  }

  if (pathname === '/api/iap/apple/webhook' && req.method === 'POST') {
    // App Store Server Notifications V2 — decode best-effort; require signed payload later
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    const notificationType = body.notificationType || body.notification_type || 'unknown'
    const eventId = `apple_asn_${body.notificationUUID || body.notification_uuid || crypto.randomUUID()}`
    try {
      const existing = await findPaymentEventById(eventId)
      if (!existing) {
        await writePaymentEvent({
          event_id: eventId,
          event: `apple.${notificationType}`,
          status: String(notificationType),
          method: 'apple',
          notes: { subtype: body.subtype },
          payload: body,
        })
      }
      // Expire on REFUND / REVOKE / EXPIRE when appAccountToken maps to user (future: decode signedPayload)
      const expireTypes = new Set(['REFUND', 'REVOKE', 'EXPIRED', 'GRACE_PERIOD_EXPIRED'])
      if (expireTypes.has(String(notificationType).toUpperCase()) && body.userId) {
        await expireSubscription(body.userId).catch(() => null)
      }
      return json(res, 200, { ok: true })
    } catch (err) {
      console.error('[iap/apple/webhook]', err.message)
      return json(res, 500, { error: err.message })
    }
  }

  if (pathname === '/api/iap/google/webhook' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    // Pub/Sub push: { message: { data: base64 } }
    let decoded = body
    if (body.message?.data) {
      try {
        decoded = JSON.parse(Buffer.from(body.message.data, 'base64').toString('utf8'))
      } catch {
        decoded = body
      }
    }
    const eventId = `google_rtdn_${body.message?.messageId || crypto.randomUUID()}`
    try {
      const existing = await findPaymentEventById(eventId)
      if (!existing) {
        await writePaymentEvent({
          event_id: eventId,
          event: 'google.rtdn',
          status: 'received',
          method: 'google',
          notes: decoded,
          payload: body,
        })
      }
      return json(res, 200, { ok: true })
    } catch (err) {
      console.error('[iap/google/webhook]', err.message)
      return json(res, 500, { error: err.message })
    }
  }

  return json(res, 404, { error: 'not_found' })
}
