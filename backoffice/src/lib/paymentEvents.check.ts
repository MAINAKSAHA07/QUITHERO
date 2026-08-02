import { dedupePaymentEvents } from './paymentEvents'

// One payment fires 3 lifecycle events → one row, and it's the captured one.
const collapsed = dedupePaymentEvents([
  { id: 'a', event: 'order.paid', payment_id: 'pay_1' },
  { id: 'b', event: 'payment.authorized', payment_id: 'pay_1' },
  { id: 'c', event: 'payment.captured', payment_id: 'pay_1' },
])
console.assert(collapsed.length === 1, 'one payment → one row')
console.assert(collapsed[0].event === 'payment.captured', 'keeps captured over authorized/order.paid')

// Distinct payments stay separate.
console.assert(
  dedupePaymentEvents([
    { id: 'a', event: 'payment.captured', payment_id: 'pay_1' },
    { id: 'b', event: 'payment.captured', payment_id: 'pay_2' },
  ]).length === 2,
  'different payments not merged'
)

// Failures / refunds / no payment_id pass through untouched.
const mixed = dedupePaymentEvents([
  { id: 'a', event: 'payment.captured', payment_id: 'pay_1' },
  { id: 'b', event: 'payment.failed', payment_id: 'pay_9' },
  { id: 'c', event: 'refund.processed', payment_id: 'pay_1' },
  { id: 'd', event: 'order.paid' },
])
console.assert(mixed.length === 4, 'non-lifecycle + no payment_id preserved')

// Order preserved: representative sits at first-seen position.
const ordered = dedupePaymentEvents([
  { id: 'a', event: 'payment.authorized', payment_id: 'pay_1' },
  { id: 'b', event: 'payment.failed', payment_id: 'pay_2' },
  { id: 'c', event: 'payment.captured', payment_id: 'pay_1' },
])
console.assert(ordered[0].payment_id === 'pay_1' && ordered[0].event === 'payment.captured', 'rep stays in place, upgraded')
console.assert(ordered[1].id === 'b', 'unrelated row order kept')

console.log('paymentEvents.check OK')
