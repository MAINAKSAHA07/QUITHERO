/**
 * ponytail: slip copy must be random — KYC widens pool, never 1:1 predict
 */
import assert from 'node:assert/strict'
import {
  slipMotivationLine,
  slipMotivationPool,
  slipRecoveryHeadline,
  slipRecoveryName,
} from './slipRecoveryCopy.ts'

assert.equal(slipRecoveryName({ user: 'u', quit_date: '', onboarding_name: 'Ada Lovelace' }), 'Ada')
assert.equal(slipRecoveryName({ user: 'u', quit_date: '' }), '')

const familyPool = slipMotivationPool({
  user: 'u',
  quit_date: '',
  primary_motivation: 'Family & loved ones',
})
assert.ok(familyPool.length >= 8, 'pool mixes general + theme')
assert.ok(familyPool.some((l) => /stronger than this craving/i.test(l)))
assert.ok(familyPool.some((l) => /people you care about|love was a reason|stumble/i.test(l)))

// Same KYC + different rng → can differ (not a fixed map)
const a = slipMotivationLine(
  { user: 'u', quit_date: '', primary_motivation: 'Family & loved ones' },
  () => 0.1
)
const b = slipMotivationLine(
  { user: 'u', quit_date: '', primary_motivation: 'Family & loved ones' },
  () => 0.9
)
assert.notEqual(a, b)

const money = slipMotivationLine(
  { user: 'u', quit_date: '', motivations: ['Save money'] },
  () => 0.01
)
assert.ok(typeof money === 'string' && money.length > 10)

assert.match(slipRecoveryHeadline('Ada', 5, () => 0), /Ada/i)
assert.match(slipRecoveryHeadline('', 0, () => 0), /stronger|change|noticed|zero/i)

console.log('slipRecoveryCopy.check OK')
