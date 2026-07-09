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

export function getUserLastActive(
  user: { lastActive?: string },
  latestActivityMs?: number
): Date | null {
  const candidates: number[] = []
  if (user.lastActive) candidates.push(new Date(user.lastActive).getTime())
  if (latestActivityMs) candidates.push(latestActivityMs)
  if (!candidates.length) return null
  return new Date(Math.max(...candidates))
}

export function countActiveUsers(
  users: { id: string; lastActive?: string }[],
  activityByUser: Map<string, number>,
  days: number
): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return users.filter((u) => {
    const last = getUserLastActive(u, activityByUser.get(u.id))
    return last && last.getTime() > cutoff
  }).length
}
