import assert from 'node:assert/strict'
import { getGaMeasurementId, marketingContentName, MARKETING_TRACK_PATHS } from './ga.ts'

assert.equal(getGaMeasurementId(), 'G-H4ZFZ7N46P')
assert.ok(MARKETING_TRACK_PATHS.has('/buynow'))
assert.equal(marketingContentName('/buynow'), 'Smono Buy Now')
console.log('ga.check: ok')
