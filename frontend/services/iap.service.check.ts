/**
 * ponytail: native IAP gate — web must not enable StoreKit path
 */
import assert from 'assert'
import { isNativePlatform, apiUrl } from '../utils/apiOrigin.ts'

assert.equal(isNativePlatform(), false)
assert.equal(apiUrl('/api/iap/verify'), '/api/iap/verify')
console.log('iap.service.check OK')
