import { SessionStatus } from '../types/enums'
import { ProgramDay, SessionProgress } from '../types/models'

export type ProgressByDayId = Map<string, SessionProgress>

export function indexProgressByDayId(records: SessionProgress[]): ProgressByDayId {
  return new Map(
    records
      .map((p) => {
        const raw = p.program_day as unknown
        // PB relation may be id string or expanded { id }
        const key =
          typeof raw === 'string'
            ? raw
            : raw && typeof raw === 'object' && 'id' in (raw as object)
              ? String((raw as { id: string }).id)
              : String(raw ?? '')
        return [key, p] as const
      })
      .filter(([key]) => key.length > 0)
  )
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

/** Rest period between finishing one day and opening the next. */
export const DAY_UNLOCK_COOLDOWN_MS = 12 * 60 * 60 * 1000

/**
 * Absolute ms when the day after `prevProgress` opens.
 * null when the previous day isn't completed or has no usable timestamp
 * (legacy rows) — we never retro-lock those.
 */
export function nextDayUnlockAtMs(prevProgress?: SessionProgress | null): number | null {
  if (prevProgress?.status !== SessionStatus.COMPLETED) return null
  const raw = prevProgress.completed_at || prevProgress.updated
  if (!raw) return null
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t + DAY_UNLOCK_COOLDOWN_MS : null
}

/** ms left on the rest period after `prevProgress` (0 when the next day is open). */
export function msUntilNextDay(
  prevProgress?: SessionProgress | null,
  now: Date = new Date()
): number {
  const at = nextDayUnlockAtMs(prevProgress)
  if (at == null) return 0
  return Math.max(0, at - now.getTime())
}

/** "7h 20m" / "45m" — empty when nothing left to wait. */
export function formatUnlockWait(ms: number): string {
  if (ms <= 0) return ''
  const mins = Math.ceil(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export interface DayLock {
  /** Previous day isn't finished — no amount of waiting opens this one. */
  sequenceLocked: boolean
  /** Absolute ms when the rest period ends; null when there is none. */
  unlockAtMs: number | null
}

/**
 * Time-independent lock state for a day, so a screen can hold this and let the
 * countdown expire on its own clock without refetching.
 */
export function dayLock(
  dayIndex: number,
  days: ProgramDay[],
  progressByDay: ProgressByDayId
): DayLock {
  const open: DayLock = { sequenceLocked: false, unlockAtMs: null }
  if (dayIndex <= 0) return open

  const status = dayStatus(days[dayIndex], progressByDay)
  // Always allow resume / review
  if (status === SessionStatus.COMPLETED || status === SessionStatus.IN_PROGRESS) return open

  const prev = days[dayIndex - 1]
  const prevProgress = prev?.id ? progressByDay.get(prev.id) : undefined
  if (prevProgress?.status !== SessionStatus.COMPLETED) {
    return { sequenceLocked: true, unlockAtMs: null }
  }
  return { sequenceLocked: false, unlockAtMs: nextDayUnlockAtMs(prevProgress) }
}

/** Can the user open this day from the program list? */
export function isDayUnlocked(
  dayIndex: number,
  days: ProgramDay[],
  progressByDay: ProgressByDayId,
  now: Date = new Date()
): boolean {
  const lock = dayLock(dayIndex, days, progressByDay)
  if (lock.sequenceLocked) return false
  return lock.unlockAtMs == null || lock.unlockAtMs <= now.getTime()
}

/**
 * Fraction of a day done from last_step_index (current step, 0-based).
 * At step 0 / not started → 0. Never counts a day as complete here.
 */
export function dayStepFraction(
  lastStepIndex: number | undefined | null,
  stepCount: number
): number {
  if (!stepCount || stepCount <= 0) return 0
  const idx = Math.max(0, Number(lastStepIndex) || 0)
  return Math.min(1, idx / stepCount)
}

/**
 * Overall program % — 0 when nothing started.
 * completedDays + partial current day, over totalDays.
 * (Do not use current_day/total — day 1 alone was showing ~3%.)
 */
export function programCompletionPercent(opts: {
  totalDays: number
  completedDays: number
  currentDayFraction?: number
}): number {
  const total = Math.max(0, opts.totalDays)
  if (total <= 0) return 0
  const done = Math.max(0, opts.completedDays)
  const frac = Math.min(1, Math.max(0, opts.currentDayFraction ?? 0))
  const units = Math.min(total, done + frac)
  return Math.min(100, Math.max(0, Math.round((units / total) * 100)))
}
