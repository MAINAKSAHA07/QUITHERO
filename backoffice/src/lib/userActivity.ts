type ActivityRecord = { user?: string; completed_at?: string; updated?: string }

export function indexActivityByUser(records: ActivityRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of records) {
    if (!r.user) continue
    const raw = r.completed_at || r.updated
    if (!raw) continue
    const t = new Date(raw).getTime()
    const prev = map.get(r.user) ?? 0
    if (t > prev) map.set(r.user, t)
  }
  return map
}

/** Map YYYY-MM-DD → user ids with activity that calendar day */
export function indexDailyActivity(
  users: { id: string; lastActive?: string; updated?: string }[],
  records: ActivityRecord[]
): Map<string, Set<string>> {
  const byDay = new Map<string, Set<string>>()
  const add = (userId: string, raw: string) => {
    const day = raw.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, new Set())
    byDay.get(day)!.add(userId)
  }
  for (const u of users) {
    if (u.lastActive) add(u.id, u.lastActive)
    if (u.updated) add(u.id, u.updated)
  }
  for (const r of records) {
    if (!r.user) continue
    const raw = r.completed_at || r.updated
    if (raw) add(r.user, raw)
  }
  return byDay
}

export function getUserLastActive(
  user: { lastActive?: string; updated?: string },
  latestActivityMs?: number
): Date | null {
  const candidates: number[] = []
  if (user.lastActive) candidates.push(new Date(user.lastActive).getTime())
  if (user.updated) candidates.push(new Date(user.updated).getTime())
  if (latestActivityMs) candidates.push(latestActivityMs)
  if (!candidates.length) return null
  return new Date(Math.max(...candidates))
}

export function isUserActiveWithinDays(
  user: { id: string; lastActive?: string; updated?: string },
  activityByUser: Map<string, number>,
  days: number
): boolean {
  const last = getUserLastActive(user, activityByUser.get(user.id))
  if (!last) return false
  return last.getTime() > Date.now() - days * 24 * 60 * 60 * 1000
}

export function countActiveUsers(
  users: { id: string; lastActive?: string; updated?: string }[],
  activityByUser: Map<string, number>,
  days: number
): number {
  return users.filter((u) => isUserActiveWithinDays(u, activityByUser, days)).length
}

export function daysSinceLastActive(
  user: { id: string; lastActive?: string; updated?: string },
  activityByUser: Map<string, number>
): number | null {
  const last = getUserLastActive(user, activityByUser.get(user.id))
  if (!last) return null
  return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
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
}
