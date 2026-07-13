import {
  isSmokeCheckDue,
  periodsElapsedSinceAnchor,
  aggregateCheckInStats,
  SMOKE_CHECK_INTERVAL_MS,
} from './smokeCheckTiming'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const quit = '2026-07-10'
const sixH = SMOKE_CHECK_INTERVAL_MS

assert(!isSmokeCheckDue(quit, null, new Date('2026-07-10T05:00:00')), 'same quit day early — not due')
assert(isSmokeCheckDue(quit, null, new Date('2026-07-10T18:00:00')), '6h+ after quit day start — due')

const last = '2026-07-12T10:00:00.000Z'
assert(!isSmokeCheckDue(quit, last, new Date('2026-07-12T14:00:00.000Z')), 'only 4h since last — not due')
assert(isSmokeCheckDue(quit, last, new Date('2026-07-12T16:30:00.000Z')), '6.5h since last — due')

const anchor = new Date('2026-07-12T10:00:00.000Z')
assert(periodsElapsedSinceAnchor(anchor, new Date(anchor.getTime() + sixH)) === 1, 'one period')
assert(periodsElapsedSinceAnchor(anchor, new Date(anchor.getTime() + sixH * 2.5)) === 2, 'two periods overdue')

const agg = aggregateCheckInStats([
  { smoked: false, periods_credited: 16, responded_at: '2026-07-10T12:00:00.000Z' },
  { smoked: false, periods_credited: 8, responded_at: '2026-07-12T12:00:00.000Z' },
  { smoked: true, periods_credited: 0, responded_at: '2026-07-13T12:00:00.000Z' },
  { smoked: false, periods_credited: 16, responded_at: '2026-07-17T12:00:00.000Z' },
])
assert(agg.totalPeriods === 40, 'total keeps pre-slip + post-slip wins')
assert(agg.currentStreakPeriods === 16, 'current streak is only since last slip')
assert(agg.totalDays === 10, 'total days = 40 periods / 4')
assert(agg.currentStreakDays === 4, 'current streak = 16 periods / 4')

console.log('smokeCheckTiming self-check OK')
