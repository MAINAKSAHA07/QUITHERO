import crypto from 'crypto'
import { getAuthUser } from './pb-admin.js'
import { claimGiftForUser, markGiftPaid } from './gift-service.js'

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature || ''))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function handleGiftApi(req, res, pathname, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  let body
  try {
    body = JSON.parse((await readBody(req)).toString() || '{}')
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  /**
   * Guest finalize after Razorpay — marks paid + emails both parties.
   * Program access is recipient-only (buyer gets a confirmation email, not unlock).
   */
  if (pathname === '/api/finalize-gift' && req.method === 'POST') {
    const orderId = String(body.razorpay_order_id || '')
    const paymentId = String(body.razorpay_payment_id || '')
    const signature = String(body.razorpay_signature || '')
    if (!orderId || !paymentId || !signature) {
      return json(res, 400, { error: 'Missing payment fields' })
    }
    if (!process.env.RAZORPAY_KEY_SECRET || !verifyRazorpaySignature(orderId, paymentId, signature)) {
      return json(res, 400, { error: 'Signature mismatch', success: false })
    }
    try {
      const gift = await markGiftPaid(orderId, paymentId)
      return json(res, 200, {
        success: true,
        gift_id: gift.id,
        recipient_name: gift.recipient_name || '',
        recipient_email: gift.recipient_email || '',
        buyer_email: gift.buyer_email || '',
      })
    } catch (error) {
      return json(res, error.status || 500, { error: error.message || 'Could not finalize gift' })
    }
  }

  if (pathname !== '/api/claim-gift' || req.method !== 'POST') {
    return json(res, 404, { error: 'not_found' })
  }
  const user = await getAuthUser(req.headers.authorization || '')
  if (!user?.id) return json(res, 401, { error: 'Login required' })
  if (!body.token) return json(res, 400, { error: 'Missing gift token' })

  try {
    const gift = await claimGiftForUser(body.token, user)
    return json(res, 200, { success: true, gift_id: gift.id })
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Could not claim gift' })
  }
}
