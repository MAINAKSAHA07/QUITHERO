/**
 * ponytail: completed days must not overwrite saved step answers
 */
import assert from 'assert'

function shouldOverwriteStepResponse(dayStatus: string, explicitlyAllow: boolean): boolean {
  if (dayStatus === 'completed') return false
  return explicitlyAllow
}

assert.equal(shouldOverwriteStepResponse('completed', true), false)
assert.equal(shouldOverwriteStepResponse('in_progress', true), true)
assert.equal(shouldOverwriteStepResponse('in_progress', false), false)

console.log('sessionReview.check OK')
