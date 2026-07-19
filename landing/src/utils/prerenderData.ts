import type { BlogPost } from '../types/blog'

declare global {
  interface Window {
    __SMONO_BLOG_POST__?: BlogPost
    __SMONO_BLOG_LIST__?: BlogPost[]
  }
}

/** Read post embedded by prerender so hydration doesn't blank the page. */
export function readPrerenderedBlogPost(): BlogPost | undefined {
  if (typeof window === 'undefined') return undefined
  const fromWindow = window.__SMONO_BLOG_POST__
  if (fromWindow) return fromWindow
  const el = document.getElementById('smono-blog-post')
  if (!el?.textContent) return undefined
  try {
    const post = JSON.parse(el.textContent) as BlogPost
    window.__SMONO_BLOG_POST__ = post
    return post
  } catch {
    return undefined
  }
}

export function readPrerenderedBlogList(): BlogPost[] | undefined {
  if (typeof window === 'undefined') return undefined
  if (window.__SMONO_BLOG_LIST__) return window.__SMONO_BLOG_LIST__
  const el = document.getElementById('smono-blog-list')
  if (!el?.textContent) return undefined
  try {
    const posts = JSON.parse(el.textContent) as BlogPost[]
    window.__SMONO_BLOG_LIST__ = posts
    return posts
  } catch {
    return undefined
  }
}
