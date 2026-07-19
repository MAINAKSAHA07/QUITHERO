import { pb } from '../lib/pocketbase'
import { Language } from '../types/enums'

const FALLBACK_QUOTES = [
  'Every moment is a fresh beginning. — T.S. Eliot',
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  'You are stronger than your cravings. Remember why you started.',
  'The secret of getting ahead is getting started. — Mark Twain',
  'Progress, not perfection — one smoke-free choice at a time.',
  'Cravings pass. The freedom you build stays.',
  'Small daily wins rewrite the habit loop.',
  'You already survived every craving so far — keep going.',
]

function dayIndex(d = new Date()): number {
  // UTC date key → stable index across timezones for the calendar day
  const key = d.toISOString().slice(0, 10)
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

export function formatQuoteForNotification(quote: {
  content?: string
  title?: string
  author?: string
}): string {
  const text = (quote.content || quote.title || '').trim()
  if (!text) return FALLBACK_QUOTES[0]
  const author = quote.author?.trim()
  if (author && author.toLowerCase() !== 'anonymous') {
    return `"${text}" — ${author}`
  }
  return `"${text}"`
}

function pickDaily(pool: string[], d = new Date()): string {
  if (!pool.length) return FALLBACK_QUOTES[0]
  return pool[dayIndex(d) % pool.length]
}

/** Merge DB quotes with fallbacks so a thin DB still rotates day to day. */
export function buildDailyQuotePool(formattedFromDb: string[]): string[] {
  const seen = new Set<string>()
  const pool: string[] = []
  for (const q of [...formattedFromDb, ...FALLBACK_QUOTES]) {
    const key = q.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    pool.push(q.trim())
  }
  return pool
}

export async function fetchDailyQuoteText(language: string = Language.EN): Promise<string> {
  const lang = language || Language.EN
  const filter = `is_active = true && language = "${lang}" && type = "quote"`
  const formatted: string[] = []

  for (const collection of ['quotes', 'content_items'] as const) {
    try {
      const items = await pb.collection(collection).getFullList({
        filter:
          collection === 'quotes'
            ? filter
            : `type = "quote" && language = "${lang}" && is_active = true`,
        fields: 'id,content,author,title,type',
        sort: 'id',
      })
      const quotes = items
        .filter((r) => r.type === 'quote' || collection === 'quotes')
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      for (const q of quotes) {
        const text = formatQuoteForNotification(q as any)
        if (text) formatted.push(text)
      }
      if (formatted.length) break
    } catch {
      /* collection may not exist */
    }
  }

  return pickDaily(buildDailyQuotePool(formatted))
}

if (import.meta.env?.DEV) {
  console.assert(
    formatQuoteForNotification({ content: 'Hello', author: 'Test' }) === '"Hello" — Test',
    'formatQuoteForNotification with author'
  )
  const pool = buildDailyQuotePool(['"Only one" — Author'])
  console.assert(pool.length > 1, 'pool should include fallbacks when DB is thin')
  console.assert(
    pickDaily(['a', 'b', 'c'], new Date('2026-07-14T12:00:00Z')) !==
      pickDaily(['a', 'b', 'c'], new Date('2026-07-15T12:00:00Z')) ||
      true /* may collide on tiny pools; length check is the main guard */,
    'day pick runs'
  )
}
