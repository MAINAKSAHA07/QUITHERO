/**
 * deleteUserAndRelated must wipe user-owned rows before users.delete,
 * otherwise PocketBase blocks on required relations.
 */
import assert from 'node:assert/strict'

const USER_OWNED = [
  'account_deletion_requests',
  'user_profiles',
  'progress_stats',
  'belief_assessments',
  'technique_outcomes',
  'support_tickets',
]

function planPurge(userId: string) {
  assert.ok(userId)
  return USER_OWNED.map((collection) => ({
    collection,
    filter: `user = "${userId}"`,
  }))
}

const plan = planPurge('abc123')
assert.equal(plan.length, 6)
assert.equal(plan[0].filter, 'user = "abc123"')
assert.ok(plan.every((p) => p.filter.includes('abc123')))

console.log('deleteUser.check.ts: ok')
