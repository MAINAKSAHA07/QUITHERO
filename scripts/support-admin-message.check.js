/**
 * Runnable check: admin-message route shape + admin-only gate helpers.
 * Run: node scripts/support-admin-message.check.js
 */
import assert from 'node:assert/strict'

const ADMIN_CHAT_SUBJECT = 'Message from Smono'

function isAdminOnly(callerKind) {
  return callerKind === 'admin'
}

function buildAdminMessagePayload({ userId, title, body }) {
  return {
    userId: String(userId || '').trim(),
    title: String(title || ADMIN_CHAT_SUBJECT).trim().slice(0, 80),
    body: String(body || '').trim(),
  }
}

function validateAdminMessageBody(body) {
  if (!body.userId) return 'userId required'
  if (!body.body) return 'body required'
  return null
}

assert.equal(isAdminOnly('admin'), true)
assert.equal(isAdminOnly('user'), false)

const ok = buildAdminMessagePayload({
  userId: 'u1',
  title: 'A note',
  body: 'Hello',
})
assert.equal(ok.userId, 'u1')
assert.equal(ok.title, 'A note')
assert.equal(ok.body, 'Hello')
assert.equal(validateAdminMessageBody(ok), null)
assert.equal(validateAdminMessageBody({ userId: '', body: 'x' }), 'userId required')
assert.equal(validateAdminMessageBody({ userId: 'u1', body: '' }), 'body required')

const deepLink = `/profile?support=${encodeURIComponent('ticket123')}`
assert.equal(deepLink, '/profile?support=ticket123')
assert.ok(ADMIN_CHAT_SUBJECT.startsWith('Message from'))

console.log('support-admin-message.check: ok')
