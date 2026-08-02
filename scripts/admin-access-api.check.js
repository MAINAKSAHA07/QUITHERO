/**
 * ponytail: admin grant path names only
 */
import assert from 'assert'

const GRANT = '/api/admin/grant-access'
const REVOKE = '/api/admin/revoke-access'

assert.ok(GRANT.startsWith('/api/admin/'))
assert.ok(REVOKE.startsWith('/api/admin/'))
assert.notEqual(GRANT, REVOKE)

console.log('admin-access-api.check OK')
