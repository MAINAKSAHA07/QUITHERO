import { daysSinceQuitDate, localDateISO } from './smokeFreeDays'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const fixed = new Date(2026, 6, 9) // Jul 9 2026 local

assert(daysSinceQuitDate('2026-07-09', fixed) === 0, 'same day → 0')
assert(daysSinceQuitDate('2026-07-05', fixed) === 4, 'Jul 5 → Jul 9 = 4')
assert(daysSinceQuitDate('2026-07-05 18:24:35.348Z', fixed) === 4, 'timestamp uses date part only')
assert(daysSinceQuitDate('2026-07-15', fixed) === 0, 'future quit → 0')
assert(daysSinceQuitDate(null) === 0, 'null → 0')
assert(localDateISO(fixed) === '2026-07-09', 'localDateISO')

console.log('smokeFreeDays self-check OK')
