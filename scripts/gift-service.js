import crypto from 'crypto'
import { adminAuth, getPbUrl } from './pb-admin.js'
import { activateSubscription } from './subscription-activate.js'
import { sendGiftEmails } from './lifecycle-email.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeGiftEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateGiftDetails(input = {}) {
  const buyerEmail = normalizeGiftEmail(input.buyer_email)
  const recipientEmail = normalizeGiftEmail(input.recipient_email)
  if (!EMAIL_RE.test(buyerEmail) || !EMAIL_RE.test(recipientEmail)) {
    return { ok: false, error: 'Enter valid buyer and recipient email addresses' }
  }
  if (buyerEmail === recipientEmail) {
    return { ok: false, error: 'Use a different email for the person receiving the gift' }
  }
  return {
    ok: true,
    buyer_email: buyerEmail,
    recipient_email: recipientEmail,
    buyer_name: String(input.buyer_name || '').trim().slice(0, 100),
    recipient_name: String(input.recipient_name || '').trim().slice(0, 100),
    message: String(input.message || '').trim().slice(0, 500),
  }
}

function claimSecret() {
  return process.env.GIFT_CLAIM_SECRET || process.env.RAZORPAY_KEY_SECRET || ''
}

/** Recipient-only claim token (buyer does not get program access). */
export function makeGiftClaimToken(orderId, role = 'recipient') {
  const id = String(orderId || '')
  const subject = `${role}:${id}`
  const signature = crypto.createHmac('sha256', claimSecret()).update(subject).digest('base64url')
  return `${Buffer.from(subject).toString('base64url')}.${signature}`
}

export function hashGiftClaimToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex')
}

async function pbRequest(path, options = {}) {
  const token = await adminAuth()
  if (!token) throw new Error('Admin auth unavailable')
  return fetch(`${getPbUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: token,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
}

async function findGift(field, value) {
  const safe = String(value || '').replace(/"/g, '')
  const filter = encodeURIComponent(`${field} = "${safe}"`)
  const res = await pbRequest(`/api/collections/gifts/records?filter=${filter}&perPage=1`)
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] || null
}

async function patchGift(id, payload) {
  const res = await pbRequest(`/api/collections/gifts/records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || 'Failed to update gift')
  return res.json()
}

export async function createPendingGift({ order, details, country, priced }) {
  const recipientClaimToken = makeGiftClaimToken(order.id, 'recipient')
  const res = await pbRequest('/api/collections/gifts/records', {
    method: 'POST',
    body: JSON.stringify({
      razorpay_order_id: order.id,
      buyer_email: details.buyer_email,
      buyer_name: details.buyer_name,
      recipient_email: details.recipient_email,
      recipient_name: details.recipient_name,
      message: details.message,
      country,
      amount_major: priced.major,
      currency: order.currency,
      coupon: priced.coupon || '',
      status: 'pending',
      recipient_claim_token_hash: hashGiftClaimToken(recipientClaimToken),
    }),
  })
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || 'Failed to save gift')
  return { gift: await res.json() }
}

export async function markGiftPaid(orderId, paymentId = '') {
  const gift = await findGift('razorpay_order_id', orderId)
  if (!gift) {
    throw Object.assign(new Error('Gift record not found for this order'), { status: 404 })
  }
  const paid = await patchGift(gift.id, {
    razorpay_payment_id: paymentId || gift.razorpay_payment_id || '',
    status: gift.recipient_user_id ? 'claimed' : 'paid',
    paid_at: gift.paid_at || new Date().toISOString(),
  })

  const sent = await sendGiftEmails(paid, {
    recipient: makeGiftClaimToken(orderId, 'recipient'),
  }).catch((error) => {
    console.error('[gift-email]', error?.message || error)
    return {}
  })
  const emailPatch = {}
  if (sent.buyer && !paid.buyer_emailed_at) emailPatch.buyer_emailed_at = new Date().toISOString()
  if (sent.recipient && !paid.recipient_emailed_at) emailPatch.recipient_emailed_at = new Date().toISOString()
  return Object.keys(emailPatch).length ? patchGift(paid.id, emailPatch) : paid
}

/** Recipient-only unlock. Buyer tokens / buyer accounts never get program access from a gift. */
export async function claimGiftForUser(rawToken, user) {
  const hash = hashGiftClaimToken(rawToken)
  const gift = await findGift('recipient_claim_token_hash', hash)
  if (!gift) {
    // Legacy buyer links still exist in old emails — never unlock for them.
    const buyerGift = await findGift('buyer_claim_token_hash', hash)
    if (buyerGift) {
      throw Object.assign(
        new Error(
          'This gift unlocks access only for the recipient. Open the invitation emailed to them, or contact support@smono.app.'
        ),
        { status: 403 }
      )
    }
    throw Object.assign(new Error('This gift link is invalid or payment is still processing'), { status: 404 })
  }
  if (!['paid', 'partially_claimed', 'claimed'].includes(gift.status)) {
    throw Object.assign(new Error('This gift link is invalid or payment is still processing'), { status: 404 })
  }
  if (gift.recipient_user_id && gift.recipient_user_id !== user.id) {
    throw Object.assign(new Error('This gift has already been claimed'), { status: 409 })
  }
  if (normalizeGiftEmail(user.email) !== normalizeGiftEmail(gift.recipient_email)) {
    throw Object.assign(
      new Error(`Sign in with ${gift.recipient_email} to claim this gift`),
      { status: 403 }
    )
  }
  await activateSubscription(user.id, gift.country, { suppressPurchaseEmail: true })
  return patchGift(gift.id, {
    recipient_user_id: user.id,
    status: 'claimed',
  })
}
