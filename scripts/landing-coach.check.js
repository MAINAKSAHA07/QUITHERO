import assert from 'node:assert/strict'
import { LANDING_COACH_USER_LIMIT, remainingUserMessages } from './landing-coach-api.js'

assert.equal(LANDING_COACH_USER_LIMIT, 10)
assert.equal(remainingUserMessages(0), 10)
assert.equal(remainingUserMessages(9), 1)
assert.equal(remainingUserMessages(10), 0)
assert.equal(remainingUserMessages(99), 0)
console.log('landing-coach.check: ok')
