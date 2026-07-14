import { pb } from '../lib/pocketbase'
import type { BlogPost } from '../types/blog'

const PUBLIC_FILTER =
  '(type = "blog" || type = "article" || type = "guide") && status = "published" && is_active = true'

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
  const rows = await pb.collection('content_items').getFullList({
    filter: PUBLIC_FILTER,
    sort: '-published_at,-id',
  })
  return rows as unknown as BlogPost[]
}

export async function getBlogBySlug(slugOrId: string): Promise<BlogPost | null> {
  const escaped = escapeFilterValue(slugOrId)
  try {
    const row = await pb.collection('content_items').getFirstListItem(
      `${PUBLIC_FILTER} && slug = "${escaped}"`
    )
    return row as unknown as BlogPost
  } catch {
    try {
      const row = await pb.collection('content_items').getFirstListItem(
        `${PUBLIC_FILTER} && id = "${escaped}"`
      )
      return row as unknown as BlogPost
    } catch {
      return null
    }
  }
}
