import { parseLocalDate, startOfLocalDay } from './smokeFreeDays'

export const SMOKE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
export const SMOKE_CHECK_PERIODS_PER_DAY = 24 / 6

function parseLocalDateOnly(raw: string): Date | null {
  return parseLocalDate(raw)
}

/** Anchor for the next check: last response time, or start of quit day. */
export function smokeCheckAnchor(
  quitDateRaw: string | null | undefined,
  lastRespondedAt: string | null | undefined
): Date | null {
  if (lastRespondedAt) {
    const t = new Date(lastRespondedAt)
    if (!Number.isNaN(t.getTime())) return t
  }
  const quit = quitDateRaw ? parseLocalDateOnly(quitDateRaw) : null
  if (!quit) return null
  return startOfLocalDay(quit)
}

export function isPastQuitDay(quitDateRaw: string | null | undefined, now = new Date()): boolean {
  const quit = quitDateRaw ? parseLocalDateOnly(quitDateRaw) : null
  if (!quit) return false
  return startOfLocalDay(now).getTime() >= quit.getTime()
}

export function isSmokeCheckDue(
  quitDateRaw: string | null | undefined,
  lastRespondedAt: string | null | undefined,
  now = new Date()
): boolean {
  if (!isPastQuitDay(quitDateRaw, now)) return false
  const anchor = smokeCheckAnchor(quitDateRaw, lastRespondedAt)
  if (!anchor) return false
  return now.getTime() - anchor.getTime() >= SMOKE_CHECK_INTERVAL_MS
}

export function periodsElapsedSinceAnchor(anchor: Date, now = new Date()): number {
  const ms = now.getTime() - anchor.getTime()
  if (ms < SMOKE_CHECK_INTERVAL_MS) return 0
  return Math.max(1, Math.floor(ms / SMOKE_CHECK_INTERVAL_MS))
}

export type CheckInLike = {
  smoked?: boolean | null
  periods_credited?: number | null
  responded_at?: string | null
}

/** Lifetime confirmed periods + current streak since last slip (slip does not erase prior wins). */
export function aggregateCheckInStats(checkIns: CheckInLike[]) {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.responded_at || 0).getTime() - new Date(b.responded_at || 0).getTime()
  )

  let totalPeriods = 0
  let currentStreakPeriods = 0

  for (const row of sorted) {
    if (row.smoked === true) continue
    totalPeriods += row.periods_credited ?? 0
  }

  for (let i = sorted.length - 1; i >= 0; i--) {
    const row = sorted[i]
    if (row.smoked === true) break
    currentStreakPeriods += row.periods_credited ?? 0
  }

  return {
    totalPeriods,
    currentStreakPeriods,
    totalDays: totalPeriods / SMOKE_CHECK_PERIODS_PER_DAY,
    currentStreakDays: currentStreakPeriods / SMOKE_CHECK_PERIODS_PER_DAY,
  }
}

export function nextSmokeCheckAt(
  quitDateRaw: string | null | undefined,
  lastRespondedAt: string | null | undefined,
  _now = new Date()
): Date | null {
  const anchor = smokeCheckAnchor(quitDateRaw, lastRespondedAt)
  if (!anchor) return null
  return new Date(anchor.getTime() + SMOKE_CHECK_INTERVAL_MS)
}
