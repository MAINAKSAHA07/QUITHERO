import type { BlogPost } from '../types/blog'

export type PrerenderedBlogDetail = {
  post: BlogPost
  related?: BlogPost[]
}

declare global {
  interface Window {
    __SMONO_BLOG_POST__?: BlogPost
    __SMONO_BLOG_DETAIL__?: PrerenderedBlogDetail
    __SMONO_BLOG_LIST__?: BlogPost[]
  }
}

function parseJsonEl<T>(id: string): T | undefined {
  const el = document.getElementById(id)
  if (!el?.textContent) return undefined
  try {
    return JSON.parse(el.textContent) as T
  } catch {
    return undefined
  }
}

/** Read post (+ related) embedded by prerender so hydration doesn't blank the page. */
export function readPrerenderedBlogDetail(): PrerenderedBlogDetail | undefined {
  if (typeof window === 'undefined') return undefined
  if (window.__SMONO_BLOG_DETAIL__) return window.__SMONO_BLOG_DETAIL__

  const detail = parseJsonEl<PrerenderedBlogDetail | BlogPost>('smono-blog-post')
  if (!detail) return undefined

  // Legacy bootstrap was a bare BlogPost
  const normalized: PrerenderedBlogDetail =
    detail && typeof detail === 'object' && 'post' in detail && (detail as PrerenderedBlogDetail).post
      ? (detail as PrerenderedBlogDetail)
      : { post: detail as BlogPost, related: [] }

  window.__SMONO_BLOG_DETAIL__ = normalized
  window.__SMONO_BLOG_POST__ = normalized.post
  return normalized
}

export function readPrerenderedBlogPost(): BlogPost | undefined {
  return readPrerenderedBlogDetail()?.post
}

export function readPrerenderedBlogList(): BlogPost[] | undefined {
  if (typeof window === 'undefined') return undefined
  if (window.__SMONO_BLOG_LIST__) return window.__SMONO_BLOG_LIST__
  const posts = parseJsonEl<BlogPost[]>('smono-blog-list')
  if (!posts) return undefined
  window.__SMONO_BLOG_LIST__ = posts
  return posts
}
