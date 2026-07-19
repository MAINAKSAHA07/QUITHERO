import pb from '../lib/pocketbase'
import { apiUrl } from '../utils/apiOrigin'

export type CreateOrderResult = {
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

export type VerifyPaymentInput = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  country?: string
}

function authHeaders(): HeadersInit {
  const token = pb.authStore.token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  }
}

export async function createOrder(country: string, coupon?: string): Promise<CreateOrderResult> {
  const res = await fetch(apiUrl('/api/create-order'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      country,
      ...(coupon?.trim() ? { coupon: coupon.trim() } : {}),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Could not start payment (${res.status})`)
  }
  return data as CreateOrderResult
}

export type PreviewCouponResult = {
  country: string
  currency: string
  display_amount: number
  original_amount: number
  coupon: string
  percent_off: number
}

export async function previewCoupon(country: string, coupon: string): Promise<PreviewCouponResult> {
  const res = await fetch(apiUrl('/api/preview-coupon'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ country, coupon: coupon.trim() }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Invalid coupon (${res.status})`)
  }
  return data as PreviewCouponResult
}

export async function verifyPayment(payload: VerifyPaymentInput): Promise<{ success: boolean }> {
  const res = await fetch(apiUrl('/api/verify-payment'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Payment verification failed (${res.status})`)
  }
  return data
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
    }
  }
}

export function loadRazorpayScript(): Promise<boolean> {
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
