import { apiUrl } from './apiOrigin'

/** Embed hosts (YouTube, Vimeo) vs direct file URLs from uploads or CDN. */
export function isEmbedVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|player\.vimeo/i.test(url)
}

/**
 * Normalize media URLs saved by the admin (proxy-relative or absolute PB).
 * Prefer `/api/pocketbase/...`; on Capacitor prepend api origin (web unchanged).
 */
export function resolveMediaUrl(url?: string): string {
  if (!url?.trim()) return ''
  const trimmed = url.trim()
  if (/^(data:|blob:)/i.test(trimmed)) return trimmed
  if (isEmbedVideoUrl(trimmed)) return trimmed
  if (trimmed.startsWith('/api/pocketbase/')) return apiUrl(trimmed)

  const filesPath = trimmed.match(/(\/api\/files\/.+)$/)?.[1]
  if (filesPath) return apiUrl(`/api/pocketbase${filesPath}`)

  return trimmed
}
