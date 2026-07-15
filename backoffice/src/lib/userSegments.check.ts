/**
 * ponytail: assert segment membership matches card labels — fails if filters drift
 */
import assert from 'assert'
import { userMatchesSegment, isSegmentId, segmentNeedsActivity } from './userSegments.ts'

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
// Never-activated must NOT count as inactive/churned (was showing "all users")
assert.equal(
  userMatchesSegment({ id: 'ghost' }, 'inactive', { activityByUser: activity }),
  false
)
assert.equal(
  userMatchesSegment({ id: 'ghost' }, 'churned', { activityByUser: activity }),
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

const empty = new Map<string, number>()
assert.equal(
  userMatchesSegment({ id: 'a' }, 'inactive', { activityByUser: empty }),
  false
)

console.log('userSegments.check OK')
