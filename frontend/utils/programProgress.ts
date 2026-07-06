import { SessionStatus } from '../types/enums'
import { ProgramDay, SessionProgress } from '../types/models'

export type ProgressByDayId = Map<string, SessionProgress>

export function indexProgressByDayId(records: SessionProgress[]): ProgressByDayId {
  return new Map(records.map((p) => [p.program_day as string, p]))
}

/** Longest completed streak from Day 1 (stops at first gap) */
export function consecutiveCompletedCount(
  days: ProgramDay[],
  progressByDay: ProgressByDayId
): number {
  let count = 0
  for (const day of days) {
    if (!day.id) break
    if (progressByDay.get(day.id)?.status === SessionStatus.COMPLETED) count++
    else break
  }
  return count
}

/** First incomplete day number (1-based) — where "Continue" should land */
export function expectedCurrentDayNumber(
  days: ProgramDay[],
  progressByDay: ProgressByDayId
): number {
  return Math.min(consecutiveCompletedCount(days, progressByDay) + 1, days.length || 30)
}

export function dayStatus(
  day: ProgramDay,
  progressByDay: ProgressByDayId
): SessionStatus {
  if (!day.id) return SessionStatus.NOT_STARTED
  return (progressByDay.get(day.id)?.status as SessionStatus) || SessionStatus.NOT_STARTED
}

/** Can the user open this day from the program list? */
export function isDayUnlocked(
  dayIndex: number,
  days: ProgramDay[],
  progressByDay: ProgressByDayId
): boolean {
  if (dayIndex <= 0) return true

  const day = days[dayIndex]
  const status = dayStatus(day, progressByDay)

  // Always allow resume / review
  if (status === SessionStatus.COMPLETED || status === SessionStatus.IN_PROGRESS) {
    return true
  }

  const prev = days[dayIndex - 1]
  if (!prev?.id) return false
  return progressByDay.get(prev.id)?.status === SessionStatus.COMPLETED
}
