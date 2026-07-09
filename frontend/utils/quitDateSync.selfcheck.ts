import { daysSinceQuitDate, localDateISO } from './smokeFreeDays'
import {
  alignedQuitDateIfBehind,
  needsQuitDatePush,
  quitDateForCompletedDays,
} from './quitDateSync'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const fixed = new Date(2026, 6, 9) // Jul 9 2026 local

assert(quitDateForCompletedDays(0, fixed) === '2026-07-09', '0 completed → today')
assert(quitDateForCompletedDays(3, fixed) === '2026-07-06', '3 completed → Jul 6')
assert(daysSinceQuitDate(quitDateForCompletedDays(3, fixed), fixed) === 3, 'aligned days = 3')

assert(needsQuitDatePush('2026-07-01', 3, fixed) === true, '7 calendar > 3 completed → push')
assert(needsQuitDatePush('2026-07-06', 3, fixed) === false, 'already aligned')
assert(needsQuitDatePush('2026-07-08', 3, fixed) === false, 'ahead of sessions → no pull')
assert(needsQuitDatePush('2026-07-01', 0, fixed) === true, 'no sessions → push to today')

assert(alignedQuitDateIfBehind('2026-07-01', 3, fixed) === '2026-07-06', 'push to Jul 6')
assert(alignedQuitDateIfBehind('2026-07-06', 3, fixed) === null, 'no change when aligned')
assert(alignedQuitDateIfBehind('2026-07-08', 3, fixed) === null, 'no pull when ahead')
assert(localDateISO(fixed) === '2026-07-09', 'localDateISO')

console.log('quitDateSync self-check OK')
