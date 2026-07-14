export type ActivityRecord = {
  user?: string
  completed_at?: string
  updated?: string
  created?: string
  responded_at?: string
  date?: string
}

export function indexActivityByUser(records: ActivityRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of records) {
    if (!r.user) continue
    const raw = r.completed_at || r.responded_at || r.date || r.created
    if (!raw) continue
    const t = new Date(raw).getTime()
    const prev = map.get(r.user) ?? 0
    if (t > prev) map.set(r.user, t)
  }
  return map
}

/** Map YYYY-MM-DD → user ids with activity that calendar day (real events only). */
export function indexDailyActivity(records: ActivityRecord[]): Map<string, Set<string>> {
  const byDay = new Map<string, Set<string>>()
  for (const r of records) {
    if (!r.user) continue
    const raw = r.completed_at || r.responded_at || r.date || r.created
    if (!raw) continue
    const day = raw.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, new Set())
    byDay.get(day)!.add(r.user)
  }
  return byDay
}

/** Last real app event only — ignores users.lastActive heartbeat. */
export function getUserLastActive(
  _user: { lastActive?: string },
  latestActivityMs?: number
): Date | null {
  if (!latestActivityMs) return null
  return new Date(latestActivityMs)
}

export function isUserActiveWithinDays(
  user: { id: string; lastActive?: string },
  activityByUser: Map<string, number>,
  days: number
): boolean {
  const since = daysSinceLastActive(user, activityByUser)
  if (since === null) return false
  return since < days
}

export function countActiveUsers(
  users: { id: string; lastActive?: string }[],
  activityByUser: Map<string, number>,
  days: number
): number {
  return users.filter((u) => isUserActiveWithinDays(u, activityByUser, days)).length
}

export function daysSinceLastActive(
  user: { id: string; lastActive?: string },
  activityByUser: Map<string, number>
): number | null {
  const last = getUserLastActive(user, activityByUser.get(user.id))
  if (!last) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastDay = new Date(last)
  lastDay.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))
}

// ponytail: dev-only sanity check
if (import.meta.env?.DEV) {
  const map = indexActivityByUser([
    { user: 'a', completed_at: '2026-01-02T10:00:00Z' },
    { user: 'a', updated: '2026-01-05T10:00:00Z' },
  ])
  console.assert(map.get('a') === new Date('2026-01-05T10:00:00Z').getTime(), 'indexActivityByUser picks latest')
  console.assert(
    isUserActiveWithinDays({ id: 'a', lastActive: '2026-01-01' }, map, 7) === false,
    'isUserActiveWithinDays respects cutoff'
  )
  console.assert(
    getUserLastActive({ lastActive: '2026-07-13' }, undefined) === null,
    'getUserLastActive ignores heartbeat when no indexed events'
  )
}
