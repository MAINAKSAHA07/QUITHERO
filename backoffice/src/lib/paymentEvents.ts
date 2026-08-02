/**
 * Razorpay emits authorized → captured → order.paid for a single payment,
 * all sharing one payment_id. The feed showed each as its own row (and
 * double-counted captures/volume). Collapse the success lifecycle to one row
 * per payment, keeping the most meaningful event (captured > order.paid >
 * authorized). Failures, refunds, disputes, and anything without a payment_id
 * pass through untouched so nothing real is hidden.
 */
export type PaymentEventLike = {
  id: string
  event?: string
  payment_id?: string
}

const LIFECYCLE_PRIORITY: Record<string, number> = {
  'payment.captured': 3,
  'order.paid': 2,
  'payment.authorized': 1,
}

export function dedupePaymentEvents<T extends PaymentEventLike>(rows: T[]): T[] {
  const repIndexByPayment = new Map<string, number>()
  const out: T[] = []

  for (const row of rows) {
    const priority = row.event ? LIFECYCLE_PRIORITY[row.event] : undefined
    if (!priority || !row.payment_id) {
      out.push(row)
      continue
    }
    const existingIndex = repIndexByPayment.get(row.payment_id)
    if (existingIndex === undefined) {
      repIndexByPayment.set(row.payment_id, out.length)
      out.push(row)
      continue
    }
    const existing = out[existingIndex]
    const existingPriority = (existing.event && LIFECYCLE_PRIORITY[existing.event]) || 0
    if (priority > existingPriority) {
      out[existingIndex] = row
    }
  }

  return out
}
