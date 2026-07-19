/**
 * Razorpay Standard Checkout — create order + verify signature.
 * Secret never leaves this module / api-server.
 */
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { adminAuth, getAuthUser, getPbUrl } from './pb-admin.js'
import { activateSubscription } from './subscription-activate.js'
import { resolvePlan, toRazorpayAmount } from './razorpay-pricing.js'
import {
  normalizeCouponCode,
  applyPercentOffMajor,
  validateCouponRecord,
} from './coupon-pricing.js'

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) return null
  return new Razorpay({ key_id, key_secret })
}

function isConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

async function findCouponByCode(code) {
  const token = await adminAuth()
  if (!token) return null
  const pb = getPbUrl()
  const filter = encodeURIComponent(`code = "${code.replace(/"/g, '')}"`)
  const res = await fetch(`${pb}/api/collections/coupons/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: token },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] || null
}

/** Resolve optional coupon → discounted major amount + meta. */
async function resolveCheckoutAmount(plan, couponRaw) {
  const code = normalizeCouponCode(couponRaw)
  if (!code) {
    return {
      major: plan.amount,
      original: plan.amount,
      coupon: '',
      percent_off: 0,
      coupon_id: '',
    }
  }

  const row = await findCouponByCode(code)
  if (!row) return { error: 'Invalid coupon' }
  const valid = validateCouponRecord(row)
  if (!valid.ok) return { error: valid.error }

  const priced = applyPercentOffMajor(plan.amount, valid.percent_off, plan.currency)
  if (!priced.ok) return { error: priced.error }

  return {
    major: priced.discounted,
    original: priced.original,
    coupon: code,
    percent_off: priced.percent_off,
    coupon_id: row.id,
    clamped: Boolean(priced.clamped),
  }
}

/**
 * Increment redeemed_count once per order_id (verify + webhook safe).
 * Exported for webhook path.
 */
export async function redeemCouponForOrder(couponCode, orderId) {
  const code = normalizeCouponCode(couponCode)
  if (!code || !orderId) return

  const token = await adminAuth()
  if (!token) return

  const row = await findCouponByCode(code)
  if (!row?.id) return

  const prev = Array.isArray(row.redeemed_orders) ? row.redeemed_orders : []
  if (prev.includes(orderId)) return

  const pb = getPbUrl()
  const nextOrders = [...prev, orderId].slice(-200)
  const nextCount = (Number(row.redeemed_count) || 0) + 1
  await fetch(`${pb}/api/collections/coupons/records/${row.id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redeemed_count: nextCount,
      redeemed_orders: nextOrders,
    }),
  })
}

export async function handleRazorpayApi(req, res, pathname, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  // POST /api/preview-coupon — price check only (no Razorpay order)
  if (pathname === '/api/preview-coupon' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    const country = String(body.country || 'IN').toUpperCase().slice(0, 2)
    const plan = resolvePlan(country)
    const code = String(body.coupon || '').trim()
    if (!code) return json(res, 400, { error: 'Enter a coupon code' })

    const priced = await resolveCheckoutAmount(plan, code)
    if (priced.error) return json(res, 400, { error: priced.error })
    if (!priced.coupon) return json(res, 400, { error: 'Invalid coupon' })

    const amount = toRazorpayAmount(priced.major, plan.currency)
    if (amount < 100) {
      return json(res, 400, { error: 'Discounted amount too low for checkout' })
    }

    return json(res, 200, {
      country,
      currency: plan.currency,
      display_amount: priced.major,
      original_amount: priced.original,
      coupon: priced.coupon,
      percent_off: priced.percent_off,
    })
  }

  if (!isConfigured()) {
    return json(res, 503, { error: 'Razorpay not configured' })
  }

  // POST /api/create-order — auth optional (landing guest checkout)
  if (pathname === '/api/create-order' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }

    const auth = req.headers.authorization
    const user = auth ? await getAuthUser(auth) : null
    // Invalid token when provided → 401 (don't silently treat as guest)
    if (auth && !user?.id) return json(res, 401, { error: 'Invalid or expired session' })

    const country = String(body.country || 'IN').toUpperCase().slice(0, 2)
    const plan = resolvePlan(country)

    const priced = await resolveCheckoutAmount(plan, body.coupon)
    if (priced.error) return json(res, 400, { error: priced.error })

    const amount = toRazorpayAmount(priced.major, plan.currency)
    if (amount < 100) {
      return json(res, 400, { error: 'Amount must be at least 100 (smallest currency unit)' })
    }

    const razorpay = getRazorpay()
    const receipt = (
      user?.id ? `sm_${user.id.slice(0, 8)}_${Date.now()}` : `sm_g_${Date.now()}`
    ).slice(0, 40)

    try {
      const notes = {
        country,
        ...(user?.id ? { user_id: user.id } : { guest: '1' }),
      }
      if (priced.coupon) {
        notes.coupon = priced.coupon
        notes.percent_off = String(priced.percent_off)
        notes.original_amount = String(priced.original)
        if (priced.coupon_id) notes.coupon_id = priced.coupon_id
      }

      const order = await razorpay.orders.create({
        amount,
        currency: plan.currency,
        receipt,
        notes,
      })
      return json(res, 200, {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        country,
        display_amount: priced.major,
        original_amount: priced.original,
        coupon: priced.coupon || undefined,
        percent_off: priced.percent_off || undefined,
      })
    } catch (err) {
      const status = err?.statusCode === 401 ? 401 : 500
      console.error('[razorpay/create-order]', err?.error || err?.message || err)
      return json(res, status, {
        error: err?.error?.description || err?.message || 'Failed to create order',
      })
    }
  }

  // POST /api/verify-payment — always requires logged-in app user
  if (pathname === '/api/verify-payment' && req.method === 'POST') {
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

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      country,
    } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(res, 400, { error: 'Missing payment fields' })
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const a = Buffer.from(expected)
    const b = Buffer.from(String(razorpay_signature))
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return json(res, 400, { error: 'Signature mismatch', success: false })
    }

    try {
      await activateSubscription(user.id, country)

      // Redeem coupon from order notes (idempotent)
      try {
        const rzp = getRazorpay()
        const order = await rzp.orders.fetch(razorpay_order_id)
        const couponCode = order?.notes?.coupon
        if (couponCode) await redeemCouponForOrder(couponCode, razorpay_order_id)
      } catch (err) {
        console.error('[razorpay/verify-payment] coupon redeem', err?.message || err)
      }

      return json(res, 200, {
        success: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      })
    } catch (err) {
      console.error('[razorpay/verify-payment]', err.message)
      return json(res, 500, {
        success: false,
        error: err.message || 'Payment verified but activation failed',
        payment_id: razorpay_payment_id,
      })
    }
  }

  return json(res, 404, { error: 'not_found' })
}

export function isRazorpayReady() {
  return isConfigured()
}
