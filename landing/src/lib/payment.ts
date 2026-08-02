import { goToApp, paymentReturnCallbackUrl } from './appUrl'
import { getCountryConfig } from './pricing'
import { trackMetaEvent } from './metaPixel'
import { trackGaEvent } from './ga'

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

async function createGuestOrder(
  country: string,
  coupon?: string,
  extra: Record<string, string> = {}
): Promise<OrderResult> {
  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      country,
      ...(coupon?.trim() ? { coupon: coupon.trim() } : {}),
      ...extra,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Could not start payment (${res.status})`)
  return data as OrderResult
}

export type LandingGiftDetails = {
  buyerName: string
  buyerEmail: string
  recipientName: string
  recipientEmail: string
  message?: string
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
      // UPI / netbanking redirect flows POST here instead of firing handler
      callback_url: paymentReturnCallbackUrl(order.country),
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
    trackMetaEvent('InitiateCheckout', {
      value: order.display_amount ?? order.amount / 100,
      currency: order.currency,
      content_name: 'Smono 30-day program',
    })
    trackGaEvent('begin_checkout', {
      currency: order.currency,
      value: order.display_amount ?? order.amount / 100,
      items: [{ item_name: 'Smono 30-day program' }],
    })
    rzp.open()
  })
}

export type GiftCheckoutResult = {
  recipientName: string
  recipientEmail: string
  buyerEmail: string
}

/** Gift checkout → finalize on server (emails) → stay on landing. No buyer claim-payment redirect. */
export async function startLandingGiftCheckout(
  country: string,
  details: LandingGiftDetails,
  coupon?: string
): Promise<GiftCheckoutResult> {
  const ready = await loadRazorpayScript()
  if (!ready || !window.Razorpay) {
    throw new Error('Could not load payment checkout. Check your connection and try again.')
  }
  const order = await createGuestOrder(country, coupon, {
    kind: 'gift',
    buyer_name: details.buyerName,
    buyer_email: details.buyerEmail,
    recipient_name: details.recipientName,
    recipient_email: details.recipientEmail,
    message: details.message || '',
  })
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID || order.key_id
  return new Promise<GiftCheckoutResult>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key,
      amount: order.amount,
      currency: order.currency,
      name: 'Smono',
      description: `Gift Smono to ${details.recipientName}`,
      order_id: order.order_id,
      prefill: { contact: '', email: details.buyerEmail, name: details.buyerName },
      theme: { color: '#3F8DD2' },
      handler: (response: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) => {
        void (async () => {
          try {
            const res = await fetch('/api/finalize-gift', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || `Could not finish gift (${res.status})`)
            trackMetaEvent('Purchase', {
              value: order.display_amount ?? order.amount / 100,
              currency: order.currency,
              content_name: 'Smono gift',
            })
            trackGaEvent('purchase', {
              currency: order.currency,
              value: order.display_amount ?? order.amount / 100,
              items: [{ item_name: 'Smono gift' }],
            })
            resolve({
              recipientName: String(data.recipient_name || details.recipientName),
              recipientEmail: String(data.recipient_email || details.recipientEmail),
              buyerEmail: String(data.buyer_email || details.buyerEmail),
            })
          } catch (err) {
            reject(err instanceof Error ? err : new Error('Could not finish gift'))
          }
        })()
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    })
    rzp.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed'))
    })
    trackMetaEvent('InitiateCheckout', {
      value: order.display_amount ?? order.amount / 100,
      currency: order.currency,
      content_name: `Gift Smono — ${details.recipientName}`,
    })
    trackGaEvent('begin_checkout', {
      currency: order.currency,
      value: order.display_amount ?? order.amount / 100,
      items: [{ item_name: `Gift Smono — ${details.recipientName}` }],
    })
    rzp.open()
  })
}
