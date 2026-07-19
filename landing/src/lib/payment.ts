import { goToApp } from './appUrl'
import { getCountryConfig } from './pricing'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
    }
  }
}

type OrderResult = {
  order_id: string
  amount: number
  currency: string
  key_id: string
  country: string
  display_amount?: number
  original_amount?: number
  coupon?: string
  percent_off?: number
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const existing = document.querySelector('script[data-razorpay]')
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpay = '1'
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/** Preview coupon discount without creating a Razorpay order. */
export async function previewLandingCoupon(
  country: string,
  coupon: string
): Promise<{
  display_amount: number
  original_amount: number
  coupon: string
  percent_off: number
}> {
  const res = await fetch('/api/preview-coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, coupon: coupon.trim() }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Invalid coupon (${res.status})`)
  return data
}

async function createGuestOrder(country: string, coupon?: string): Promise<OrderResult> {
  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      country,
      ...(coupon?.trim() ? { coupon: coupon.trim() } : {}),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Could not start payment (${res.status})`)
  return data as OrderResult
}

/** Landing checkout → pay → claim on app (login/signup then activate). */
export async function startLandingCheckout(country: string, coupon?: string): Promise<void> {
  const ready = await loadRazorpayScript()
  if (!ready || !window.Razorpay) {
    throw new Error('Could not load payment checkout. Check your connection and try again.')
  }

  const order = await createGuestOrder(country, coupon)
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID || order.key_id
  const config = getCountryConfig(country)

  await new Promise<void>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key,
      amount: order.amount,
      currency: order.currency,
      name: 'Smono',
      description: order.coupon
        ? `30-day program · ${order.coupon} (−${order.percent_off}%)`
        : `30-day quit program (${config.currency})`,
      order_id: order.order_id,
      // ponytail: empty contact — Razorpay otherwise prefills merchant/account phone
      prefill: { contact: '', email: '', name: '' },
      theme: { color: '#3F8DD2' },
      handler: (response: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) => {
        const q = new URLSearchParams({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          country: order.country,
        })
        goToApp(`/claim-payment?${q.toString()}`)
        resolve()
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    })
    rzp.on('payment.failed', (resp) => {
      reject(new Error(resp?.error?.description || 'Payment failed'))
    })
    rzp.open()
  })
}
