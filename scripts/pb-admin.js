function resolvePbUrl() {
  return (
    process.env.POCKETBASE_INTERNAL_URL ||
    process.env.AWS_POCKETBASE_URL ||
    process.env.VITE_POCKETBASE_URL ||
    'http://127.0.0.1:8096'
  ).replace(/\/$/, '')
}

const ADMIN_EMAIL = () => process.env.AWS_PB_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = () => process.env.AWS_PB_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD

let cachedToken = null
let tokenExpiry = 0

export function getPbUrl() {
  return resolvePbUrl()
}

export async function adminAuth() {
  const email = ADMIN_EMAIL()
  const password = ADMIN_PASSWORD()
  if (!email || !password) return null
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const res = await fetch(`${resolvePbUrl()}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  }).catch(() => null)

  if (!res?.ok) {
    cachedToken = null
    return null
  }

  const data = await res.json()
  cachedToken = data.token
  tokenExpiry = Date.now() + 6 * 60 * 60 * 1000
  return cachedToken
}

export async function getAuthUser(token) {
  if (!token) return null
  const clean = String(token).replace(/^Bearer\s+/i, '').trim()
  if (!clean) return null
  const res = await fetch(`${resolvePbUrl()}/api/collections/users/auth-refresh`, {
    method: 'POST',
    headers: { Authorization: clean },
  }).catch(() => null)
  if (!res?.ok) return null
  const data = await res.json()
  return data.record || null
}

/** Validate backoffice admin_users JWT (not app users). */
export async function getAuthAdmin(token) {
  if (!token) return null
  const clean = String(token).replace(/^Bearer\s+/i, '').trim()
  if (!clean) return null
  const res = await fetch(`${resolvePbUrl()}/api/collections/admin_users/auth-refresh`, {
    method: 'POST',
    headers: { Authorization: clean },
  }).catch(() => null)
  if (!res?.ok) return null
  const data = await res.json()
  return data.record || null
}
