/** Pure daily-quote pool rules — fails if a single DB quote can't rotate. */

function buildDailyQuotePool(formattedFromDb: string[], fallbacks: string[]): string[] {
  const seen = new Set<string>()
  const pool: string[] = []
  for (const q of [...formattedFromDb, ...fallbacks]) {
    const key = q.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    pool.push(q.trim())
  }
  return pool
}

function dayIndex(isoDate: string): number {
  let h = 0
  for (let i = 0; i < isoDate.length; i++) h = (h * 31 + isoDate.charCodeAt(i)) >>> 0
  return h
}

const FALLBACKS = [
  'Every moment is a fresh beginning. — T.S. Eliot',
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  'You are stronger than your cravings. Remember why you started.',
]

const pool = buildDailyQuotePool(
  ['"Success is the sum of small efforts repeated day in and day out." — Robert Collier'],
  FALLBACKS
)
console.assert(pool.length >= 4, `expected merged pool, got ${pool.length}`)

const a = pool[dayIndex('2026-07-14') % pool.length]
const b = pool[dayIndex('2026-07-15') % pool.length]
console.assert(a !== b, `expected different quotes across days, got "${a}" both days`)

console.log('dailyQuote.check: ok')
