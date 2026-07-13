import { getPbUrl } from './pb-admin.js'

const quoteCache = new Map()

const FALLBACK_QUOTES = [
  'Every moment is a fresh beginning. — T.S. Eliot',
  'Believe you can and you\'re halfway there. — Theodore Roosevelt',
  'You are stronger than your cravings. Remember why you started.',
]

function dayOfYear(d = new Date()) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
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

async function fetchQuoteRecords(token, language) {
  const pb = getPbUrl()
  const lang = language || 'en'
  const filter = encodeURIComponent(`is_active=true && language="${lang}" && type="quote"`)

  for (const collection of ['quotes', 'content_items']) {
    const res = await fetch(
      `${pb}/api/collections/${collection}/records?filter=${filter}&perPage=200&fields=content,author,title,type,language,is_active`,
      { headers: { Authorization: token } }
    ).catch(() => null)
    if (!res?.ok) continue
    const data = await res.json()
    const items = (data.items || []).filter((r) => r.type === 'quote' || collection === 'quotes')
    if (items.length) return items
  }
  return []
}

/** Same quote all day for a language — used by morning push scheduler */
export async function getDailyQuoteText(token, language = 'en') {
  const cacheKey = `${new Date().toISOString().slice(0, 10)}:${language}`
  if (quoteCache.has(cacheKey)) return quoteCache.get(cacheKey)

  const items = await fetchQuoteRecords(token, language)
  let text
  if (items.length) {
    text = formatQuote(items[dayOfYear() % items.length])
  }
  if (!text) {
    text = FALLBACK_QUOTES[dayOfYear() % FALLBACK_QUOTES.length]
  }

  quoteCache.set(cacheKey, text)
  if (quoteCache.size > 32) quoteCache.clear()
  return text
}

if (process.argv[1]?.endsWith('daily-quote.js')) {
  console.assert(formatQuote({ content: 'Hello', author: 'Test' }) === '"Hello" — Test')
  console.assert(formatQuote({ content: 'Solo' }) === '"Solo"')
}
