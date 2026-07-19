/**
 * Universal / App Links + custom scheme (smono://) → React Router.
 */
export function pathFromAppUrl(url: string): string | null {
  try {
    const u = new URL(url)

    // smono://claim-payment?token=…  → /claim-payment?token=…
    if (u.protocol === 'smono:') {
      const hostPath = u.hostname ? `/${u.hostname}` : ''
      const rest = u.pathname && u.pathname !== '/' ? u.pathname : ''
      const path = `${hostPath}${rest}${u.search}${u.hash}` || '/'
      if (
        path.startsWith('/claim-payment') ||
        path.startsWith('/subscription-confirmed') ||
        path.startsWith('/oauth-callback')
      ) {
        return path
      }
      return path.startsWith('/') ? path : `/${path}`
    }

    const path = `${u.pathname}${u.search}${u.hash}`
    if (path.startsWith('/claim-payment') || path.startsWith('/subscription-confirmed')) {
      return path
    }
    if (u.hostname === 'app.smono.app' || u.hostname === 'www.smono.app') {
      return path.startsWith('/') ? path : `/${path}`
    }
    return null
  } catch {
    return null
  }
}

/** Call once from App root with navigate. Native App listener is in nativeBoot. */
export function installDeepLinkHandler(navigate: (to: string, opts?: { replace?: boolean }) => void) {
  if (typeof window === 'undefined') return () => {}

  const go = (url: string) => {
    const path = pathFromAppUrl(url)
    if (path) navigate(path, { replace: true })
  }

  ;(window as unknown as { __smonoOpenUrl?: (url: string) => void }).__smonoOpenUrl = go

  return () => {
    delete (window as unknown as { __smonoOpenUrl?: unknown }).__smonoOpenUrl
  }
}
