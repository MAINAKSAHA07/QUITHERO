/**
 * ponytail: spike rules for AI craving intervention — fails if thresholds drift
 */
import assert from 'assert'
import { shouldTriggerCravingSpike } from '../utils/cravingSpike.ts'

assert.equal(shouldTriggerCravingSpike(5, 1), true, 'intensity 5 triggers')
assert.equal(shouldTriggerCravingSpike(3, 2), true, '2 in window triggers')
assert.equal(shouldTriggerCravingSpike(3, 1), false, 'single mild craving does not')
assert.equal(shouldTriggerCravingSpike(4, 1), false, 'intensity 4 alone does not')

console.log('cravingSpike.check OK')
