import { useEffect } from 'react'
import { pageUrl } from '../lib/seo.config'

type SeoOpts = {
  title: string
  description: string
  canonicalPath: string
}

function upsertMeta(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.querySelector(selector)
  if (el instanceof HTMLMetaElement || el instanceof HTMLLinkElement) {
    el.setAttribute(attr, value)
  }
}

export function usePageSeo({ title, description, canonicalPath }: SeoOpts) {
  useEffect(() => {
    document.title = title
    const canonical = pageUrl(canonicalPath)

    upsertMeta('meta[name="description"]', 'content', description)
    upsertMeta('meta[property="og:title"]', 'content', title)
    upsertMeta('meta[property="og:description"]', 'content', description)
    upsertMeta('meta[property="og:url"]', 'content', canonical)
    upsertMeta('meta[name="twitter:title"]', 'content', title)
    upsertMeta('meta[name="twitter:description"]', 'content', description)
    upsertMeta('link[rel="canonical"]', 'href', canonical)
  }, [title, description, canonicalPath])
}
