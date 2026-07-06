import { SessionStatus } from '../types/enums'
import {
  consecutiveCompletedCount,
  expectedCurrentDayNumber,
  indexProgressByDayId,
  isDayUnlocked,
} from './programProgress'

const days = [
  { id: 'd1', day_number: 1 },
  { id: 'd2', day_number: 2 },
  { id: 'd3', day_number: 3 },
  { id: 'd4', day_number: 4 },
] as any[]

const progress = indexProgressByDayId([
  { program_day: 'd1', status: SessionStatus.IN_PROGRESS },
  { program_day: 'd2', status: SessionStatus.IN_PROGRESS },
  { program_day: 'd3', status: SessionStatus.COMPLETED },
] as any[])

console.assert(isDayUnlocked(1, days, progress), 'in-progress day 2 unlocked')
console.assert(isDayUnlocked(2, days, progress), 'completed day 3 unlocked')
console.assert(!isDayUnlocked(3, days, progress), 'day 4 locked until day 3 path — wait day 3 complete so day 4 unlocked')
console.assert(isDayUnlocked(3, days, progress), 'day 4 unlocked after day 3 complete')
console.assert(expectedCurrentDayNumber(days, progress) === 1, 'continue lands on day 1 when streak broken')
console.assert(consecutiveCompletedCount(days, progress) === 0, 'no consecutive complete from day 1')
