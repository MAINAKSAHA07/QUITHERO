/**
 * ponytail: IAP route wiring — fails if exports/path names drift
 */
import assert from 'assert'
import { handleIapApi, isIapReady } from './iap-api.js'

assert.equal(typeof handleIapApi, 'function')
assert.equal(typeof isIapReady, 'function')
assert.equal(isIapReady(), false) // no env → off (safe default)
console.log('iap-api.check OK')
