/** Strip HTML tags for card excerpts and meta descriptions. */
import { blogPlainText } from './prepareBlogHtml'

export function stripHtml(html: string): string {
  return blogPlainText(html)
}

export function blogExcerpt(content?: string, excerpt?: string, maxLen = 160): string {
  if (excerpt?.trim()) return excerpt.trim()
  const plain = blogPlainText(content || '')
  if (!plain) return ''
  if (plain.length <= maxLen) return plain
  return `${plain.slice(0, maxLen).trim()}…`
}
