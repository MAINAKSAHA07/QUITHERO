/** Embed hosts (YouTube, Vimeo) vs direct file URLs from uploads or CDN. */
export function isEmbedVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|player\.vimeo/i.test(url)
}

/**
 * Normalize media URLs saved by the admin (proxy-relative or absolute PB).
 * Always prefer same-origin `/api/pocketbase/...` so Vite/nginx can proxy files.
 */
export function resolveMediaUrl(url?: string): string {
  if (!url?.trim()) return ''
  const trimmed = url.trim()
  if (/^(data:|blob:)/i.test(trimmed)) return trimmed
  if (isEmbedVideoUrl(trimmed)) return trimmed
  if (trimmed.startsWith('/api/pocketbase/')) return trimmed

  const filesPath = trimmed.match(/(\/api\/files\/.+)$/)?.[1]
  if (filesPath) return `/api/pocketbase${filesPath}`

  return trimmed
}
