import crypto from 'crypto'

const secret = 'test_webhook_secret'
const raw = '{"event":"payment.captured","id":"evt_test"}'
const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex')
console.assert(sig.length === 64)
console.assert(
  crypto.createHmac('sha256', secret).update(raw).digest('hex') === sig
)
console.log('razorpay-webhook.sig.check: ok')
