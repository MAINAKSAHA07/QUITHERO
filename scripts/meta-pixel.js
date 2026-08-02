/** Meta (Facebook) Pixel — shared by landing + app. ID is public; override via VITE_META_PIXEL_ID. */
const DEFAULT_PIXEL_ID = '2020960708540154'

export function getMetaPixelId() {
  const fromEnv =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_META_PIXEL_ID : ''
  const id = String(fromEnv || '').trim()
  return id || DEFAULT_PIXEL_ID
}

function injectBootstrap() {
  if (typeof window === 'undefined' || window.fbq) return
  const n = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  })
  if (!window._fbq) window._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  const t = document.createElement('script')
  t.async = true
  t.src = 'https://connect.facebook.net/en_US/fbevents.js'
  const s = document.getElementsByTagName('script')[0]
  s.parentNode.insertBefore(t, s)
}

/** Load + init once. PageView is sent by MetaPixelPageTracker (or index.html on first paint). */
export function ensureMetaPixel() {
  if (typeof window === 'undefined') return false
  const id = getMetaPixelId()
  if (!id) return false
  if (!window.fbq) injectBootstrap()
  if (!window.__smonoMetaPixelInited) {
    window.fbq('init', id)
    window.__smonoMetaPixelInited = true
  }
  return true
}

export function trackMetaPageView() {
  if (!ensureMetaPixel()) return
  window.fbq('track', 'PageView')
}

/** Standard events: InitiateCheckout, Purchase, CompleteRegistration, Lead, … */
export function trackMetaEvent(eventName, params = {}) {
  if (!ensureMetaPixel()) return
  window.fbq('track', eventName, params)
}
