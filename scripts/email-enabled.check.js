/**
 * ponytail: email kill-switch must not imply push is off
 */
import assert from 'node:assert/strict'

function channelsIndependent(emailOn, pushOn) {
  // Deactivating email never forces push off
  return { emailOn: !!emailOn, pushOn: !!pushOn }
}

assert.deepEqual(channelsIndependent(false, true), { emailOn: false, pushOn: true })
assert.deepEqual(channelsIndependent(true, true), { emailOn: true, pushOn: true })
assert.deepEqual(channelsIndependent(false, false), { emailOn: false, pushOn: false })

console.log('email-enabled.check OK')
