/** Records on/after signup + N days (latest activity timestamp only). */
export function cohortRetentionPct(
  cohortUsers: { id: string; created?: string }[],
  activityByUser: Map<string, number>,
  daysAfterSignup: number
): number {
  if (cohortUsers.length === 0) return 0
  let retained = 0
  for (const u of cohortUsers) {
    if (!u.created) continue
    const ms = activityByUser.get(u.id)
    if (!ms) continue
    const threshold = new Date(u.created)
    threshold.setDate(threshold.getDate() + daysAfterSignup)
    if (ms >= threshold.getTime()) retained++
  }
  return Math.round((retained / cohortUsers.length) * 100)
}

/** Cutoff date for analytics date-range filters. */
export function activitySinceDate(range: 'week' | 'month' | 'all'): Date | null {
  if (range === 'all') return null
  const d = new Date()
  d.setDate(d.getDate() - (range === 'week' ? 7 : 30))
  d.setHours(0, 0, 0, 0)
  return d
}

export function recordInRange(
  raw: string | undefined,
  since: Date | null
): boolean {
  if (!since) return true
  if (!raw) return false
  return new Date(raw) >= since
}
