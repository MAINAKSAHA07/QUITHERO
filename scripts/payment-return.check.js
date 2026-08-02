import assert from 'node:assert/strict'
import { buildClaimPaymentRedirect } from './razorpay-api.js'

const url = buildClaimPaymentRedirect({
  razorpay_order_id: 'order_abc',
  razorpay_payment_id: 'pay_xyz',
  razorpay_signature: 'sig123',
  country: 'in',
})

assert.match(url, /^https:\/\/app\.smono\.app\/claim-payment\?/)
assert.match(url, /razorpay_order_id=order_abc/)
assert.match(url, /razorpay_payment_id=pay_xyz/)
assert.match(url, /country=IN/)

console.log('payment-return.check: ok')
