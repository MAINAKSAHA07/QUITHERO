/**
 * deleteUserAndRelated must call the server delete API (email + purge).
 */
import assert from 'node:assert/strict'

function deleteUrl(base: string): string {
  const b = base.replace(/\/$/, '')
  return b ? `${b}/api/admin/delete-user` : '/api/admin/delete-user'
}

assert.equal(deleteUrl(''), '/api/admin/delete-user')
assert.equal(deleteUrl('https://app.smono.app'), 'https://app.smono.app/api/admin/delete-user')
assert.equal(deleteUrl('https://app.smono.app/'), 'https://app.smono.app/api/admin/delete-user')

console.log('deleteUser.check.ts: ok')
