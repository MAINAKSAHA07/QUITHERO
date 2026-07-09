/**
 * Calendar days since quit_date (local dates only — avoids UTC timestamp off-by-one).
 * "2026-07-05" or "2026-07-05 18:24:35.348Z" → day count from that calendar day to today.
 */
export function daysSinceQuitDate(quitDateRaw: string | undefined | null, now = new Date()): number {
  if (!quitDateRaw) return 0
  const m = String(quitDateRaw).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return 0
  const quit = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // round: both are local midnights; DST can make the ms gap slightly off from 86400000
  return Math.max(0, Math.round((today.getTime() - quit.getTime()) / 86_400_000))
}

export function localDateISO(d = new Date()): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

// ponytail: one assert-based self-check — run: npx tsx frontend/utils/smokeFreeDays.selfcheck.ts
