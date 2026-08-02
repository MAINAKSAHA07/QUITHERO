/**
 * ponytail: assert segment membership matches card labels — fails if filters drift
 */
import assert from 'assert'
import {
  userMatchesSegment,
  userMatchesCustomCriteria,
  isSegmentId,
  segmentNeedsActivity,
  customCriteriaNeedsActivity,
  customCriteriaNeedsEngagement,
  resolveSegmentFilter,
  normalizeCriteria,
} from './userSegments.ts'

const activity = new Map<string, number>([
  ['a', Date.now()],
  ['b', Date.now() - 40 * 86400000],
  ['c', Date.now() - 100 * 86400000],
])

assert.equal(isSegmentId('active'), true)
assert.equal(isSegmentId('nope'), false)
assert.equal(segmentNeedsActivity('active'), true)
assert.equal(segmentNeedsActivity('new-users'), false)

assert.equal(
  userMatchesSegment({ id: 'a' }, 'active', { activityByUser: activity }),
  true
)
assert.equal(
  userMatchesSegment({ id: 'b' }, 'active', { activityByUser: activity }),
  false
)
assert.equal(
  userMatchesSegment({ id: 'b' }, 'inactive', { activityByUser: activity }),
  true
)
assert.equal(
  userMatchesSegment({ id: 'c' }, 'churned', { activityByUser: activity }),
  true
)
// Never-activated counts as inactive/churned (no activity in window)
assert.equal(
  userMatchesSegment({ id: 'ghost' }, 'inactive', { activityByUser: activity }),
  true
)
assert.equal(
  userMatchesSegment({ id: 'ghost' }, 'churned', { activityByUser: activity }),
  true
)
assert.equal(
  userMatchesSegment({ id: 'a' }, 'inactive', { activityByUser: activity }),
  false
)
assert.equal(
  userMatchesSegment(
    { id: 'n', created: new Date().toISOString() },
    'new-users',
    { activityByUser: activity }
  ),
  true
)

const profiles = new Map([
  ['kyc1', { user: 'kyc1', onboarding_completed_at: '2026-01-01T00:00:00Z' }],
  ['legacy', { user: 'legacy', quit_archetype: 'auto_pilot', quit_date: '2026-01-01' }],
])
assert.equal(isSegmentId('kyc-completed'), true)
assert.equal(
  userMatchesSegment({ id: 'kyc1' }, 'kyc-completed', {
    activityByUser: activity,
    profilesByUser: profiles,
  }),
  true
)
assert.equal(
  userMatchesSegment({ id: 'legacy' }, 'kyc-completed', {
    activityByUser: activity,
    profilesByUser: profiles,
  }),
  true
)
assert.equal(
  userMatchesSegment({ id: 'ghost' }, 'kyc-completed', {
    activityByUser: activity,
    profilesByUser: profiles,
  }),
  false
)

const empty = new Map<string, number>()
assert.equal(
  userMatchesSegment({ id: 'a' }, 'inactive', { activityByUser: empty }),
  true
)
assert.equal(
  userMatchesSegment({ id: 'a' }, 'active', { activityByUser: empty }),
  false
)

const custom = normalizeCriteria({
  activeWithinDays: 7,
  minSlips: 2,
  maxCompletedSessions: 5,
})
assert.equal(customCriteriaNeedsActivity(custom), true)
assert.equal(customCriteriaNeedsEngagement(custom), true)
assert.equal(
  userMatchesCustomCriteria(
    { id: 'a' },
    custom,
    {
      activityByUser: activity,
      sessions: [{ user: 'a', status: 'completed' }],
      cravings: [
        { user: 'a', type: 'slip' },
        { user: 'a', type: 'slip' },
      ],
    }
  ),
  true
)
assert.equal(
  userMatchesCustomCriteria(
    { id: 'a' },
    custom,
    {
      activityByUser: activity,
      sessions: [{ user: 'a', status: 'completed' }],
      cravings: [{ user: 'a', type: 'slip' }],
    }
  ),
  false
)

const customMap = new Map([
  [
    'seg1',
    { id: 'seg1', name: 'Heavy slips', criteria: custom },
  ],
])
assert.deepEqual(resolveSegmentFilter('active', customMap), {
  kind: 'predefined',
  id: 'active',
})
assert.equal(resolveSegmentFilter('seg1', customMap)?.kind, 'custom')
assert.equal(resolveSegmentFilter('missing', customMap), null)

console.log('userSegments.check OK')
