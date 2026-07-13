/** Resolve the user-app origin from the current marketing host. */
export function smonoAppUrl(): string {
  const h = window.location.hostname
  if (h === 'smono.app' || h === 'www.smono.app') return 'https://app.smono.app'
  if (h === 'localhost' || /^\d+\./.test(h)) return `http://${h}:5175`
  if (h.startsWith('app.')) return window.location.origin
  return 'https://app.smono.app'
}

export function goToApp(path = '/onboarding') {
  const base = smonoAppUrl().replace(/\/$/, '')
  window.location.href = base + path
}

export function appHref(path: string): string {
  return smonoAppUrl().replace(/\/$/, '') + path
}
