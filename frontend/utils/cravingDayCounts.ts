/** A slip is type=slip, or a craving later marked as smoked. */
export function isSlipRecord(c: {
  type?: string
  resolution_method?: string
}): boolean {
  return c.type === 'slip' || c.resolution_method === 'smoked'
}

/** Resisted craving — not a slip / smoked outcome. */
export function isResistedRecord(c: {
  type?: string
  resolution_method?: string
}): boolean {
  return c.type === 'craving' && c.resolution_method !== 'smoked'
}

export function localDayStartMs(now: Date = new Date()): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function countTodayCravingActivity(
  items: { type?: string; resolution_method?: string; created?: string }[],
  now: Date = new Date()
): { resisted: number; slipped: number } {
  const startMs = localDayStartMs(now)
  let resisted = 0
  let slipped = 0
  for (const c of items) {
    const t = new Date(c.created || '').getTime()
    if (!Number.isFinite(t) || t < startMs) continue
    if (isSlipRecord(c)) slipped++
    else if (isResistedRecord(c)) resisted++
  }
  return { resisted, slipped }
}
