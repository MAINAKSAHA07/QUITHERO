/**
 * Fetch published blog posts from PocketBase for build-time prerender + sitemap.
 * Returns [] on network errors so offline builds still succeed.
 */
import PocketBase from 'pocketbase'
import type { BlogPost } from '../src/types/blog'

const FILTER =
  '(type = "blog" || type = "article" || type = "guide") && status = "published" && is_active = true'

export async function fetchPublishedBlogs(): Promise<BlogPost[]> {
  const url = (
    process.env.POCKETBASE_INTERNAL_URL ||
    process.env.VITE_POCKETBASE_URL ||
    'http://127.0.0.1:8096'
  ).replace(/\/$/, '')

  try {
    const pb = new PocketBase(url)
    const rows = await pb.collection('content_items').getFullList({
      filter: FILTER,
      sort: '-published_at,-id',
    })
    return rows as unknown as BlogPost[]
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn(`Could not fetch blogs from PocketBase (${url}): ${msg}`)
    return []
  }
}
