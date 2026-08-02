/**
 * Human pace delay for coach replies.
 * Run: npx tsx frontend/utils/coachHumanPace.check.ts
 */
import assert from 'node:assert/strict'
import { cleanCoachReplyClient, coachTypingDelayMs } from './coachHumanPace.ts'

assert.ok(coachTypingDelayMs('Hi') >= 900)
assert.ok(coachTypingDelayMs('x'.repeat(200)) <= 4500)
assert.ok(coachTypingDelayMs('short') < coachTypingDelayMs('this is a longer reply that takes more time'))

const long = Array.from({ length: 80 }, () => 'word').join(' ')
assert.ok(cleanCoachReplyClient(long).split(/\s+/).length <= 56)

console.log('coachHumanPace.check: ok')
