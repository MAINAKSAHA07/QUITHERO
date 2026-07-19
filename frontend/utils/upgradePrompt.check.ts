import assert from 'node:assert/strict'
import { needsDay2Upgrade } from './upgradePrompt.ts'

assert.equal(needsDay2Upgrade(true, 5), false)
assert.equal(needsDay2Upgrade(false, 1), false)
assert.equal(needsDay2Upgrade(false, 2), true)
assert.equal(needsDay2Upgrade(false, 0), false)
assert.equal(needsDay2Upgrade(false, null), false)
console.log('upgradePrompt.check: ok')
