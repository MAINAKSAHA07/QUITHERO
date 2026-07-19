/**
 * ponytail: isKycComplete — completed profiles must not look unfinished
 */
import assert from 'assert'
import { isKycComplete, postAuthPath } from './kyc.ts'

assert.equal(isKycComplete(null), false)
assert.equal(isKycComplete({}), false)
assert.equal(isKycComplete({ onboarding_completed_at: '2026-01-01' }), true)
assert.equal(isKycComplete({ quit_archetype: 'escapist', quit_date: '2026-01-01' }), true)
assert.equal(
  isKycComplete({ quit_date: '2026-01-01', daily_consumption: 10 }),
  true
)
assert.equal(
  isKycComplete({ quit_date: '2026-01-01', smoking_triggers: ['stress'] }),
  true
)
assert.equal(isKycComplete({ quit_date: '2026-01-01' }), false)
assert.equal(postAuthPath({ onboarding_completed_at: 'x' }), '/home')
assert.equal(postAuthPath(null), '/kyc')

console.log('kyc.check OK')
