import { daysSinceQuitDate, localDateISO } from './smokeFreeDays'

/**
 * Quit date such that calendar days smoke-free === completedDays.
 * completedDays=0 → today; completedDays=3 → three calendar days ago.
 */
export function quitDateForCompletedDays(completedDays: number, now = new Date()): string {
  const n = Math.max(0, Math.floor(completedDays))
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - n)
  return localDateISO(d)
}

/** True when calendar smoke-free days have run ahead of completed program days. */
export function needsQuitDatePush(
  quitDateRaw: string | null | undefined,
  completedDays: number,
  now = new Date()
): boolean {
  return daysSinceQuitDate(quitDateRaw, now) > Math.max(0, Math.floor(completedDays))
}

/**
 * If the user fell behind on sessions, push quit_date forward so
 * days_smoke_free matches consecutive completed program days.
 * Never pulls quit_date backward (user ahead of the program is fine).
 */
export function alignedQuitDateIfBehind(
  quitDateRaw: string | null | undefined,
  completedDays: number,
  now = new Date()
): string | null {
  if (!needsQuitDatePush(quitDateRaw, completedDays, now)) return null
  return quitDateForCompletedDays(completedDays, now)
}
