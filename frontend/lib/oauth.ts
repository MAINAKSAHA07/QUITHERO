/** PocketBase OAuth helpers (redirect flow — avoids SSE/realtime through proxies). */

export type OAuthProvider = {
  name: string
  authURL: string
  authUrl?: string
  state: string
  codeVerifier: string
}

export function getOAuthBaseUrl(): string {
  if (import.meta.env.PROD) {
    return `${window.location.origin}/api/pocketbase`
  }
  return import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') || 'http://localhost:8096'
}

export function getOAuthRedirectUrl(oauthBaseUrl: string): string {
  return `${oauthBaseUrl.replace(/\/$/, '')}/api/oauth2-redirect`
}

/** Matches PocketBase JS SDK _replaceQueryParams + authURL+redirectURL concatenation. */
export function buildOAuthStartUrl(provider: OAuthProvider, redirectURL: string): string {
  const authURL = provider.authURL || provider.authUrl || ''
  let url = authURL + redirectURL
  const qIndex = url.indexOf('?')
  const base = qIndex >= 0 ? url.slice(0, qIndex) : url
  const query = qIndex >= 0 ? url.slice(qIndex + 1) : ''

  const params: Record<string, string> = {}
  for (const part of query.split('&')) {
    if (!part) continue
    const eq = part.indexOf('=')
    const key = decodeURIComponent((eq >= 0 ? part.slice(0, eq) : part).replace(/\+/g, ' '))
    const val = decodeURIComponent((eq >= 0 ? part.slice(eq + 1) : '').replace(/\+/g, ' '))
    params[key] = val
  }
  params.state = provider.state

  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return qs ? `${base}?${qs}` : base
}

export function stashOAuthSession(provider: OAuthProvider, redirectURL: string) {
  sessionStorage.setItem('pb_oauth_verifier', provider.codeVerifier)
  sessionStorage.setItem('pb_oauth_redirect', redirectURL)
  sessionStorage.setItem('pb_oauth_state', provider.state)
}

const AUTH_STORAGE_KEY = 'pocketbase_auth'

export function saveOAuthAuth(token: string, record: Record<string, unknown>) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, record }))
}

export function clearOAuthSession() {
  sessionStorage.removeItem('pb_oauth_verifier')
  sessionStorage.removeItem('pb_oauth_redirect')
  sessionStorage.removeItem('pb_oauth_state')
}
