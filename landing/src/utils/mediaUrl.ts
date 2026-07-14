/** Resolve blog/media image URLs for landing (proxy-relative or absolute). */
export function resolveMediaUrl(url?: string): string {
  if (!url?.trim()) return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('/api/pocketbase/')) return trimmed
  const filesPath = trimmed.match(/(\/api\/files\/.+)$/)?.[1]
  if (filesPath) return `/api/pocketbase${filesPath}`
  return trimmed
}
