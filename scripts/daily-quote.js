import { getPbUrl } from './pb-admin.js'

const quoteCache = new Map()

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

function dayIndex(d = new Date()) {
  const key = d.toISOString().slice(0, 10)
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h
}

function formatQuote(record) {
  const text = (record.content || record.title || '').trim()
  if (!text) return null
  const author = (record.author || '').trim()
  if (author && author.toLowerCase() !== 'anonymous') {
    return `"${text}" — ${author}`
  }
  return `"${text}"`
}

function buildPool(fromDb) {
  const seen = new Set()
  const pool = []
  for (const q of [...fromDb, ...FALLBACK_QUOTES]) {
    const key = String(q || '')
      .trim()
      .toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    pool.push(String(q).trim())
  }
  return pool
}

async function fetchQuoteRecords(token, language) {
  const pb = getPbUrl()
  const lang = language || 'en'
  const filter = encodeURIComponent(`is_active=true && language="${lang}" && type="quote"`)

  for (const collection of ['quotes', 'content_items']) {
    const res = await fetch(
      `${pb}/api/collections/${collection}/records?filter=${filter}&perPage=200&sort=id&fields=id,content,author,title,type,language,is_active`,
      { headers: { Authorization: token } }
    ).catch(() => null)
    if (!res?.ok) continue
    const data = await res.json()
    const items = (data.items || [])
      .filter((r) => r.type === 'quote' || collection === 'quotes')
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    if (items.length) return items
  }
  return []
}

/** Same quote all day for a language — used by morning push scheduler. Rotates by calendar day. */
export async function getDailyQuoteText(token, language = 'en') {
  const cacheKey = `${new Date().toISOString().slice(0, 10)}:${language}`
  if (quoteCache.has(cacheKey)) return quoteCache.get(cacheKey)

  const items = await fetchQuoteRecords(token, language)
  const formatted = items.map(formatQuote).filter(Boolean)
  const pool = buildPool(formatted)
  const text = pool[dayIndex() % pool.length] || FALLBACK_QUOTES[0]

  quoteCache.set(cacheKey, text)
  if (quoteCache.size > 32) {
    const keep = cacheKey
    quoteCache.clear()
    quoteCache.set(keep, text)
  }
  return text
}

if (process.argv[1]?.endsWith('daily-quote.js')) {
  console.assert(formatQuote({ content: 'Hello', author: 'Test' }) === '"Hello" — Test')
  console.assert(formatQuote({ content: 'Solo' }) === '"Solo"')
  console.assert(buildPool(['"Only one"']).length > 1, 'thin DB still rotates via fallbacks')
  const a = dayIndex(new Date('2026-07-14T12:00:00Z'))
  const b = dayIndex(new Date('2026-07-15T12:00:00Z'))
  console.assert(a !== b, 'different days → different index seeds')
  console.log('daily-quote.check: ok')
}
