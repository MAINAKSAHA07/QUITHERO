import type { BlogPost } from '../types/blog'

function publishedAt(p: BlogPost): number {
  const raw = p.published_at || p.created || ''
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : 0
}

/** Prev + next by publish date so each post gets ≥1 sibling inbound link (plus /blog). */
export function pickRelatedBlogPosts(
  current: BlogPost,
  all: BlogPost[],
  limit = 2
): BlogPost[] {
  const others = all.filter((p) => p.id !== current.id)
  if (!others.length || limit <= 0) return []

  const sorted = [...others].sort((a, b) => publishedAt(a) - publishedAt(b))
  // Include current to find neighbors in full timeline
  const timeline = [...all].sort((a, b) => publishedAt(a) - publishedAt(b))
  const idx = timeline.findIndex((p) => p.id === current.id)
  const picked: BlogPost[] = []

  if (idx >= 0) {
    if (idx > 0) picked.push(timeline[idx - 1])
    if (idx < timeline.length - 1) picked.push(timeline[idx + 1])
  }

  for (const p of sorted.reverse()) {
    if (picked.length >= limit) break
    if (picked.some((x) => x.id === p.id)) continue
    picked.push(p)
  }

  return picked.slice(0, limit)
}
