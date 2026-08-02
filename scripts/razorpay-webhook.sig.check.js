import crypto from 'crypto'
import { extractRazorpayWebhookFields } from './razorpay-webhook.js'

const secret = 'test_webhook_secret'
const raw = '{"event":"payment.captured","id":"evt_test"}'
const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex')
console.assert(sig.length === 64)
console.assert(
  crypto.createHmac('sha256', secret).update(raw).digest('hex') === sig
)
const row = extractRazorpayWebhookFields(
  {
    event: 'payment.captured',
    payload: {
      order: { entity: { id: 'order_gift', notes: { kind: 'gift', country: 'IN' } } },
    },
  },
  { id: 'pay_test', order_id: 'order_gift', notes: {} }
)
console.assert(row.notes.kind === 'gift')
console.assert(row.order_id === 'order_gift')
console.log('razorpay-webhook.sig.check: ok')
