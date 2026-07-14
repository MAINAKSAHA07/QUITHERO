/** Strip HTML tags for card excerpts and meta descriptions. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

export function blogExcerpt(content?: string, excerpt?: string, maxLen = 160): string {
  if (excerpt?.trim()) return excerpt.trim()
  const plain = stripHtml(content || '')
  if (!plain) return ''
  if (plain.length <= maxLen) return plain
  return `${plain.slice(0, maxLen).trim()}…`
}
