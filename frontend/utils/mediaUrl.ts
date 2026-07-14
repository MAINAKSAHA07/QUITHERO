/** Embed hosts (YouTube, Vimeo) vs direct file URLs from uploads or CDN. */
export function isEmbedVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|player\.vimeo/i.test(url)
}
