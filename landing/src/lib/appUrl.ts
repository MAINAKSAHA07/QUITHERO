import { APP_URL } from './seo.config'

/** Public first-step for marketing CTAs — never /kyc (auth-gated, blanks for new visitors). */
export const APP_START_PATH = '/language'

/** Resolve the user-app origin from the current marketing host. */
export function smonoAppUrl(): string {
  if (typeof window === 'undefined') return APP_URL
  const h = window.location.hostname
  if (h === 'smono.app' || h === 'www.smono.app') return APP_URL
  if (h === 'localhost' || h === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    return `http://${h}:5175`
  }
  if (h.startsWith('app.')) return window.location.origin
  return APP_URL
}

export function goToApp(path = APP_START_PATH) {
  const base = smonoAppUrl().replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  window.location.href = base + normalized
}

export function appHref(path = APP_START_PATH): string {
  const base = smonoAppUrl().replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return base + normalized
}

/** Static href for markup / prerender (production app host). */
export function appStartHref(): string {
  return `${APP_URL}${APP_START_PATH}`
}

/** Razorpay redirect/UPI flow POSTs here (same origin as checkout). */
export function paymentReturnCallbackUrl(country: string): string {
  const cc = country.toUpperCase().slice(0, 2) || 'IN'
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://www.smono.app'
  return `${origin.replace(/\/$/, '')}/api/payment-return?country=${encodeURIComponent(cc)}`
}
