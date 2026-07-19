/**
 * Auth must be readable synchronously on first paint so ProtectedRoute
 * does not bounce /progress → /login on pull-to-refresh.
 * ponytail: mirrors AppContext useState initializers.
 */
import assert from 'node:assert/strict'

function mapUser(record: { id?: string; email?: string; name?: string; avatar?: string } | null) {
  if (!record?.id) return null
  return {
    id: String(record.id),
    email: String(record.email ?? ''),
    name: String(record.name || record.email || ''),
    avatar: String(record.avatar ?? ''),
  }
}

function initAuth(store: { isValid: boolean; model: { id: string; email: string } | null }) {
  const isAuthenticated = store.isValid
  const user = isAuthenticated ? mapUser(store.model) : null
  return { isAuthenticated, user }
}

const loggedIn = initAuth({
  isValid: true,
  model: { id: 'abc', email: 'a@b.com' },
})
assert.equal(loggedIn.isAuthenticated, true)
assert.equal(loggedIn.user?.id, 'abc')

const loggedOut = initAuth({ isValid: false, model: null })
assert.equal(loggedOut.isAuthenticated, false)
assert.equal(loggedOut.user, null)

function resolvePostLoginPath(
  from: string | undefined,
  kycComplete: boolean
): string {
  if (from && from !== '/login' && from !== '/signup' && from !== '/onboarding') return from
  return kycComplete ? '/home' : '/kyc'
}

assert.equal(resolvePostLoginPath('/progress', true), '/progress')
assert.equal(resolvePostLoginPath('/home', true), '/home')
assert.equal(resolvePostLoginPath(undefined, true), '/home')
assert.equal(resolvePostLoginPath('/login', true), '/home')

console.log('auth-init.check.ts: ok')
