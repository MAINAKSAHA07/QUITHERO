/**
 * ponytail: program day gate — Home "Continue" must match Sessions unlock
 */
import assert from 'assert'
import { SessionStatus } from '../types/enums.ts'
import {
  consecutiveCompletedCount,
  expectedCurrentDayNumber,
  indexProgressByDayId,
  isDayUnlocked,
} from './programProgress.ts'

const days = [
  { id: 'd1', day_number: 1 },
  { id: 'd2', day_number: 2 },
  { id: 'd3', day_number: 3 },
  { id: 'd4', day_number: 4 },
  { id: 'd8', day_number: 8 },
] as any[]

// Expanded relation shape must still key correctly
const expanded = indexProgressByDayId([
  { program_day: { id: 'd1' }, status: SessionStatus.COMPLETED },
  { program_day: 'd2', status: SessionStatus.COMPLETED },
  { program_day: 'd3', status: SessionStatus.IN_PROGRESS },
] as any[])

assert.equal(consecutiveCompletedCount(days, expanded), 2)
assert.equal(expectedCurrentDayNumber(days, expanded), 3)
assert.equal(isDayUnlocked(2, days, expanded), true)
assert.equal(isDayUnlocked(3, days, expanded), false)

// Seven done → continue lands on day 8
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

console.log('programProgress.check OK')
