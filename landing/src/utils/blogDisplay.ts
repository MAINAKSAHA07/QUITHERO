/** Display helpers for blog cards / chrome (SEO titles stay full in <title>). */

/** Strip trailing "| Smono" / "| Brand" noise from card headlines. */
export function displayBlogTitle(title: string): string {
  return String(title || '')
    .replace(/\s*\|\s*Smono(?:\s+Blog)?\s*$/i, '')
    .replace(/\s*\|\s*Smono\s*$/i, '')
    .trim()
}

export function displayBlogType(type?: string): string {
  const t = String(type || '').toLowerCase()
  if (t === 'blog' || t === 'article') return 'Article'
  if (t === 'guide') return 'Guide'
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1)
}
