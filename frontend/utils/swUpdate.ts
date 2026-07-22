/**
 * Service worker registration + deploy updates for home-screen PWA.
 * iOS standalone won't refresh itself — we check on focus and reload when a new SW claims.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return

  // Capture before register — first install must not force a reload loop
  const hadControllerAtStart = Boolean(navigator.serviceWorker.controller)
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtStart || refreshing) return
    refreshing = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        const check = () => {
          void reg.update().catch(() => undefined)
        }

        check()
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check()
        })
        window.addEventListener('focus', check)
        window.setInterval(check, 30 * 60 * 1000)

        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch(() => undefined)
  })
}

/** Clear SW caches + unregister, then hard-navigate. Escape hatch when stuck. */
export async function hardReloadApp(path = '/') {
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    /* ignore */
  }
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
  } catch {
    /* ignore */
  }
  const dest = path.startsWith('/') ? path : '/'
  window.location.href = `${dest}${dest.includes('?') ? '&' : '?'}fresh=${Date.now()}`
}
