/** Local (not UTC) YYYY-MM-DD key, so cravings group by the day the user experienced them. */
export function localDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Build a continuous daily craving trend for the last `days` (ending on `now`).
 * Pure so it can be tested without PocketBase. Returns [] when there is no data,
 * so the UI can show its sample preview instead of an all-zero chart. Slips are
 * relapses, not cravings, and are excluded.
 */
export function buildCravingTrend(
  records: { created?: string; type?: string }[],
  days: number,
  now: Date = new Date()
): { date: string; count: number }[] {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const startMs = start.getTime()

  const counts: Record<string, number> = {}
  for (const r of records) {
    if (r.type === 'slip') continue
    const dt = r.created ? new Date(r.created) : new Date(now)
    if (dt.getTime() < startMs) continue
    const key = localDayKey(dt)
    counts[key] = (counts[key] || 0) + 1
  }

  if (Object.keys(counts).length === 0) return []

  const out: { date: string; count: number }[] = []
  const cursor = new Date(startMs)
  const todayKey = localDayKey(now)
  for (;;) {
    const key = localDayKey(cursor)
    out.push({ date: key, count: counts[key] || 0 })
    if (key === todayKey) break
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
