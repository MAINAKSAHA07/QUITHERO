import { pb } from '../lib/pocketbase'
import { Language } from '../types/enums'

const FALLBACK_QUOTES = [
  'Every moment is a fresh beginning. — T.S. Eliot',
  'Believe you can and you\'re halfway there. — Theodore Roosevelt',
  'You are stronger than your cravings. Remember why you started.',
]

function dayOfYear(d = new Date()) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
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

export async function fetchDailyQuoteText(language: string = Language.EN): Promise<string> {
  const lang = language || Language.EN
  const filter = `is_active = true && language = "${lang}" && type = "quote"`

  for (const collection of ['quotes', 'content_items'] as const) {
    try {
      const items = await pb.collection(collection).getFullList({
        filter: collection === 'quotes' ? filter : `type = "quote" && language = "${lang}" && is_active = true`,
        fields: 'content,author,title,type',
      })
      const quotes = items.filter((r) => r.type === 'quote' || collection === 'quotes')
      if (quotes.length) {
        return formatQuoteForNotification(quotes[dayOfYear() % quotes.length] as any)
      }
    } catch {
      /* collection may not exist */
    }
  }

  return FALLBACK_QUOTES[dayOfYear() % FALLBACK_QUOTES.length]
}

if (import.meta.env?.DEV) {
  console.assert(
    formatQuoteForNotification({ content: 'Hello', author: 'Test' }) === '"Hello" — Test',
    'formatQuoteForNotification with author'
  )
}
