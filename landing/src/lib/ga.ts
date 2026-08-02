/** Google Analytics 4 (gtag) for the marketing site. */
const DEFAULT_MEASUREMENT_ID = 'G-H4ZFZ7N46P'

export function getGaMeasurementId(): string {
  const fromEnv =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_GA_MEASUREMENT_ID ||
        import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID
      : ''
  return String(fromEnv || '').trim() || DEFAULT_MEASUREMENT_ID
}

export function ensureGa(): boolean {
  if (typeof window === 'undefined') return false
  const id = getGaMeasurementId()
  if (!id) return false

  if (!window.dataLayer) window.dataLayer = []
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
  }

  if (!window.__smonoGaInited) {
    const existing = document.querySelector('script[data-smono-ga]')
    if (!existing) {
      const s = document.createElement('script')
      s.async = true
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
      s.dataset.smonoGa = '1'
      document.head.appendChild(s)
    }
    window.gtag('js', new Date())
    window.gtag('config', id, { send_page_view: false })
    window.__smonoGaInited = true
  }
  return true
}

/** SPA / first-paint page view. */
export function trackGaPageView(path?: string, title?: string) {
  if (!ensureGa() || typeof window.gtag !== 'function') return
  const id = getGaMeasurementId()
  const page_path =
    path ||
    (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/')
  window.gtag('event', 'page_view', {
    send_to: id,
    page_path,
    page_title: title || (typeof document !== 'undefined' ? document.title : undefined),
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  })
}

export function trackGaEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (!ensureGa() || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}

/** Paths that get Meta ViewContent + GA view_item (buy funnel / key marketing). */
export const MARKETING_TRACK_PATHS = new Set([
  '/',
  '/buynow',
  '/pricing',
  '/gift',
  '/how-it-works',
  '/quit-smoking-program',
  '/method',
  '/about',
])

export function marketingContentName(pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/'
  if (p === '/buynow') return 'Smono Buy Now'
  if (p === '/pricing') return 'Smono Pricing'
  if (p === '/gift') return 'Smono Gift'
  if (p === '/how-it-works') return 'How Smono Works'
  if (p === '/quit-smoking-program') return 'Quit Smoking Program'
  if (p === '/method') return 'Smono Method'
  if (p === '/about') return 'About Smono'
  return 'Smono Landing'
}
