/**
 * Razorpay webhook — verify signature, persist payment_events, activate on capture/paid.
 * Signature: HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) vs X-Razorpay-Signature
 */
import crypto from 'crypto'
import { adminAuth, getPbUrl } from './pb-admin.js'
import { redeemCouponForOrder } from './razorpay-api.js'
import { activateSubscription } from './subscription-activate.js'

async function activateByUserId(userId, country) {
  if (!userId) return
  try {
    await activateSubscription(userId, country)
  } catch (err) {
    console.error('[razorpay-webhook] activate failed', err?.message || err)
  }
}

function pickEntity(payload) {
  const e = payload?.payload || {}
  return (
    e.payment?.entity ||
    e.order?.entity ||
    e.refund?.entity ||
    e.invoice?.entity ||
    e.subscription?.entity ||
    e.payment_link?.entity ||
    e.dispute?.entity ||
    null
  )
}

function extractFields(event, entity) {
  const notes = entity?.notes && typeof entity.notes === 'object' ? entity.notes : {}
  return {
    event_id: String(event?.id || ''),
    event: String(event?.event || ''),
    payment_id: entity?.id?.startsWith?.('pay_')
      ? entity.id
      : entity?.payment_id || notes.payment_id || '',
    order_id: entity?.order_id || (entity?.id?.startsWith?.('order_') ? entity.id : '') || '',
    refund_id: entity?.id?.startsWith?.('rfnd_') ? entity.id : '',
    status: entity?.status || '',
    amount: typeof entity?.amount === 'number' ? entity.amount : undefined,
    currency: entity?.currency || '',
    method: entity?.method || '',
    email: entity?.email || '',
    contact: entity?.contact || '',
    user: notes.user_id || '',
    notes,
    country: notes.country || '',
  }
}

async function storeEvent(row, payload) {
  const token = await adminAuth()
  if (!token) throw new Error('Admin auth unavailable')

  const pb = getPbUrl()
  // Idempotent: skip if event_id already stored
  if (row.event_id) {
    const filter = encodeURIComponent(`event_id = "${row.event_id}"`)
    const existing = await fetch(
      `${pb}/api/collections/payment_events/records?filter=${filter}&perPage=1`,
      { headers: { Authorization: token } }
    )
    if (existing.ok) {
      const data = await existing.json()
      if (data.items?.[0]) return data.items[0]
    }
  }

  const body = {
    event_id: row.event_id || `local_${Date.now()}`,
    event: row.event,
    payment_id: row.payment_id || '',
    order_id: row.order_id || '',
    refund_id: row.refund_id || '',
    status: row.status || '',
    currency: row.currency || '',
    method: row.method || '',
    notes: row.notes || {},
    payload,
  }
  if (typeof row.amount === 'number') body.amount = row.amount
  if (row.email) body.email = row.email
  if (row.contact) body.contact = row.contact
  if (row.user) body.user = row.user

  const res = await fetch(`${pb}/api/collections/payment_events/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Failed to store payment event: ${err || res.status}`)
  }
  return res.json()
}

export async function handleRazorpayWebhook(req, res, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
    })
    res.end()
    return
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    return json(res, 503, { error: 'Webhook secret not configured' })
  }

  const rawBuf = await readBody(req)
  const raw = rawBuf.toString('utf8')
  const signature = String(req.headers['x-razorpay-signature'] || '')

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (!signature || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return json(res, 400, { error: 'Invalid webhook signature' })
  }

  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  const entity = pickEntity(event)
  const row = extractFields(event, entity || {})

  try {
    await storeEvent(row, event)
  } catch (err) {
    console.error('[razorpay/webhook] store', err.message)
    return json(res, 500, { error: 'Failed to persist event' })
  }

  // Activate subscription when money is captured / order paid
  const activateEvents = new Set(['payment.captured', 'order.paid', 'payment.authorized'])
  if (activateEvents.has(row.event) && row.user) {
    try {
      await activateByUserId(row.user, row.country)
    } catch (err) {
      console.error('[razorpay/webhook] activate', err.message)
    }
  }

  if (activateEvents.has(row.event) && row.notes?.coupon && row.order_id) {
    try {
      await redeemCouponForOrder(row.notes.coupon, row.order_id)
    } catch (err) {
      console.error('[razorpay/webhook] coupon redeem', err?.message || err)
    }
  }

  return json(res, 200, { ok: true, event: row.event, event_id: row.event_id })
}

export function isWebhookConfigured() {
  return Boolean(process.env.RAZORPAY_WEBHOOK_SECRET)
}
