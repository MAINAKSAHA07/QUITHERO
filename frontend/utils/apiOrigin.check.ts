/**
 * ponytail: apiOrigin — web must stay relative; absolute only when Capacitor native
 */
import assert from 'assert'
import { apiUrl, getApiOrigin, getPocketBaseUrl, isNativePlatform } from './apiOrigin.ts'

assert.equal(isNativePlatform(), false)
assert.equal(getApiOrigin(), '')
assert.equal(apiUrl('/api/pocketbase'), '/api/pocketbase')
assert.equal(apiUrl('/api/create-order'), '/api/create-order')
assert.equal(apiUrl('https://example.com/x'), 'https://example.com/x')
assert.ok(getPocketBaseUrl().length > 0)

console.log('apiOrigin.check OK')
