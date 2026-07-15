/** Records on/after signup + N days (latest activity timestamp only). */
export function cohortRetentionPct(
  cohortUsers: { id: string; created?: string }[],
  activityByUser: Map<string, number>,
  daysAfterSignup: number
): number {
  if (cohortUsers.length === 0) return 0
  let retained = 0
  let eligible = 0
  for (const u of cohortUsers) {
    if (!u.created) continue
    eligible++
    const ms = activityByUser.get(u.id)
    if (!ms) continue
    const threshold = new Date(u.created)
    threshold.setDate(threshold.getDate() + daysAfterSignup)
    if (ms >= threshold.getTime()) retained++
  }
  if (eligible === 0) return 0
  return Math.round((retained / eligible) * 100)
}

/**
 * Retention curve: among users registered ≥ N days ago,
 * % with latest activity on/after day N since signup.
 */
export function retentionCurvePoints(
  users: { id: string; created?: string }[],
  activityByUser: Map<string, number>,
  maxDays: number,
  step: number
): { days: number; retention: number; eligible: number }[] {
  const out: { days: number; retention: number; eligible: number }[] = []
  const now = Date.now()
  for (let days = 0; days <= maxDays; days += Math.max(1, step)) {
    const eligible = users.filter((u) => {
      if (!u.created) return false
      const ageDays = Math.floor((now - new Date(u.created).getTime()) / (1000 * 60 * 60 * 24))
      return ageDays >= days
    })
    out.push({
      days,
      eligible: eligible.length,
      retention: cohortRetentionPct(eligible, activityByUser, days),
    })
  }
  return out
}

/** Calendar-month signup cohorts with D7 / D30 retention (newest first). */
export function signupMonthCohorts(
  users: { id: string; created?: string }[],
  activityByUser: Map<string, number>,
  monthCount = 6
): { label: string; total: number; d7: number; d30: number; matureEnoughForD30: boolean }[] {
  const now = new Date()
  const out: { label: string; total: number; d7: number; d30: number; matureEnoughForD30: boolean }[] = []

  for (let i = 0; i < monthCount; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const cohort = users.filter((u) => {
      if (!u.created) return false
      const created = new Date(u.created)
      return created >= start && created < end
    })
    const monthAgeDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    out.push({
      label: start.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      total: cohort.length,
      d7: cohortRetentionPct(cohort, activityByUser, 7),
      d30: cohortRetentionPct(cohort, activityByUser, 30),
      matureEnoughForD30: monthAgeDays >= 30,
    })
  }
  return out
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

/** Distinct user ids from rows that have a user relation. */
export function distinctUsers(rows: Array<{ user?: string } | Record<string, unknown>>): Set<string> {
  const set = new Set<string>()
  for (const r of rows) {
    const uid = (r as { user?: string }).user
    if (uid) set.add(uid)
  }
  return set
}

/** Local calendar day YYYY-MM-DD (matches DAU local cutoff). */
export function localDayKey(raw: string | Date): string {
  const d = typeof raw === 'string' ? new Date(raw) : raw
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
