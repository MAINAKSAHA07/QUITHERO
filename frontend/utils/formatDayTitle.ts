/** Present day titles without em dashes (Day 1: Title). */
export function formatDayTitle(title?: string | null): string {
  if (!title?.trim()) return ''
  return title.trim().replace(/\s*[—–]\s*/g, ': ')
}
