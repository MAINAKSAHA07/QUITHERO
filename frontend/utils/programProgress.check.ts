/**
 * ponytail: program day gate — Home "Continue" must match Sessions unlock
 */
import assert from 'assert'
import { SessionStatus } from '../types/enums.ts'
import {
  DAY_UNLOCK_COOLDOWN_MS,
  consecutiveCompletedCount,
  dayStepFraction,
  expectedCurrentDayNumber,
  formatUnlockWait,
  indexProgressByDayId,
  isDayUnlocked,
  programCompletionPercent,
} from './programProgress.ts'

const days = [
  { id: 'd1', day_number: 1 },
  { id: 'd2', day_number: 2 },
  { id: 'd3', day_number: 3 },
  { id: 'd4', day_number: 4 },
  { id: 'd8', day_number: 8 },
] as any[]

const expanded = indexProgressByDayId([
  { program_day: { id: 'd1' }, status: SessionStatus.COMPLETED },
  { program_day: 'd2', status: SessionStatus.COMPLETED },
  { program_day: 'd3', status: SessionStatus.IN_PROGRESS },
] as any[])

assert.equal(consecutiveCompletedCount(days, expanded), 2)
assert.equal(expectedCurrentDayNumber(days, expanded), 3)
assert.equal(isDayUnlocked(2, days, expanded), true)
assert.equal(isDayUnlocked(3, days, expanded), false)

const sevenDone = indexProgressByDayId(
  Array.from({ length: 7 }, (_, i) => ({
    program_day: `d${i + 1}`,
    status: SessionStatus.COMPLETED,
  })) as any[]
)
const days30 = Array.from({ length: 10 }, (_, i) => ({
  id: `d${i + 1}`,
  day_number: i + 1,
})) as any[]
assert.equal(expectedCurrentDayNumber(days30, sevenDone), 8)

assert.equal(programCompletionPercent({ totalDays: 30, completedDays: 0 }), 0)
assert.equal(programCompletionPercent({ totalDays: 30, completedDays: 0, currentDayFraction: 0 }), 0)
assert.equal(dayStepFraction(0, 10), 0)
assert.equal(dayStepFraction(3, 10), 0.3)
assert.equal(
  programCompletionPercent({
    totalDays: 30,
    completedDays: 0,
    currentDayFraction: dayStepFraction(3, 10),
  }),
  1
)
assert.equal(programCompletionPercent({ totalDays: 30, completedDays: 3 }), 10)
assert.notEqual(programCompletionPercent({ totalDays: 30, completedDays: 0 }), 3)

// 12h rest between days
const now = new Date('2026-07-24T12:00:00Z')
const justFinishedD1 = indexProgressByDayId([
  {
    program_day: 'd1',
    status: SessionStatus.COMPLETED,
    completed_at: '2026-07-24T09:00:00Z',
  },
] as any[])
assert.equal(isDayUnlocked(1, days, justFinishedD1, now), false, 'day 2 rests 12h')
assert.equal(
  isDayUnlocked(1, days, justFinishedD1, new Date(now.getTime() + DAY_UNLOCK_COOLDOWN_MS)),
  true,
  'day 2 opens once the rest period elapses'
)
// Legacy rows with no timestamp must not retro-lock anyone.
assert.equal(
  isDayUnlocked(1, days, indexProgressByDayId([
    { program_day: 'd1', status: SessionStatus.COMPLETED },
  ] as any[]), now),
  true
)
// A day already opened stays reachable regardless of the clock.
assert.equal(
  isDayUnlocked(1, days, indexProgressByDayId([
    { program_day: 'd1', status: SessionStatus.COMPLETED, completed_at: '2026-07-24T09:00:00Z' },
    { program_day: 'd2', status: SessionStatus.IN_PROGRESS },
  ] as any[]), now),
  true
)
assert.equal(formatUnlockWait(0), '')
assert.equal(formatUnlockWait(9 * 60 * 60 * 1000), '9h')
assert.equal(formatUnlockWait(9 * 60 * 60 * 1000 + 20 * 60 * 1000), '9h 20m')
assert.equal(formatUnlockWait(45 * 60 * 1000), '45m')

console.log('programProgress.check OK')
