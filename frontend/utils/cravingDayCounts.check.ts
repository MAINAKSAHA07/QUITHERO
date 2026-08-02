import assert from 'assert'
import { countTodayCravingActivity, isResistedRecord, isSlipRecord } from './cravingDayCounts.ts'

assert.equal(isSlipRecord({ type: 'slip' }), true)
assert.equal(isSlipRecord({ type: 'craving', resolution_method: 'smoked' }), true)
assert.equal(isSlipRecord({ type: 'craving' }), false)
assert.equal(isResistedRecord({ type: 'craving' }), true)
assert.equal(isResistedRecord({ type: 'craving', resolution_method: 'smoked' }), false)

const now = new Date('2026-07-24T15:00:00')
const counts = countTodayCravingActivity(
  [
    { type: 'craving', created: '2026-07-24T10:00:00' },
    { type: 'slip', created: '2026-07-24T11:00:00' },
    { type: 'craving', resolution_method: 'smoked', created: '2026-07-24T12:00:00' },
    { type: 'slip', created: '2026-07-23T12:00:00' },
  ],
  now
)
assert.equal(counts.resisted, 1)
assert.equal(counts.slipped, 2)

console.log('cravingDayCounts.check OK')
