/**
 * KYC gate must re-run when profileLoading settles — otherwise home-screen
 * users can land on /kyc stuck on "checking" forever.
 */
import assert from 'node:assert/strict'

function shouldRetryGate(deps: { userId?: string; profileLoading: boolean; userProfile: unknown }) {
  if (!deps.userId) return false
  if (deps.profileLoading && !deps.userProfile) return false
  return true
}

assert.equal(shouldRetryGate({ userId: 'u1', profileLoading: true, userProfile: null }), false)
assert.equal(shouldRetryGate({ userId: 'u1', profileLoading: false, userProfile: null }), true)
assert.equal(shouldRetryGate({ userId: 'u1', profileLoading: false, userProfile: {} }), true)
assert.equal(shouldRetryGate({ profileLoading: false, userProfile: null }), false)
console.log('kyc-gate-retry.check ok')
