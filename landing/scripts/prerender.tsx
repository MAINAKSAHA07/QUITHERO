/**
 * Build-time SSR: inject rendered React HTML into dist so crawlers get full content.
 */
import React, { type ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LandingPage } from '../src/LandingPage'
import { BlogListPage } from '../src/pages/BlogListPage'
import { BlogDetailPage } from '../src/pages/BlogDetailPage'
import { blogExcerpt } from '../src/utils/stripHtml'
import { fetchPublishedBlogs } from './fetch-published-blogs'
import {
  SEO_TITLE,
  SEO_DESCRIPTION,
  SITE_URL,
  organizationJsonLd,
  webSiteJsonLd,
  mobileAppJsonLd,
  faqJsonLd,
} from '../src/lib/seo.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, '../dist')
const baseTemplate = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

function jsonLdScript(data: object) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function injectHead(
  html: string,
  opts: {
    title: string
    description: string
    canonical: string
    ogType?: string
    ogImage?: string
  }
) {
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(opts.title)}</title>`)
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"/,
    `<meta name="description" content="${escapeAttr(opts.description)}"`
  )
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"/,
    `<meta property="og:title" content="${escapeAttr(opts.title)}"`
  )
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"/,
    `<meta property="og:description" content="${escapeAttr(opts.description)}"`
  )
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"/,
    `<meta name="twitter:title" content="${escapeAttr(opts.title)}"`
  )
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"/,
    `<meta name="twitter:description" content="${escapeAttr(opts.description)}"`
  )
  out = out.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${opts.canonical}" />`
  )
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"/,
    `<meta property="og:url" content="${opts.canonical}"`
  )
  if (opts.ogType) {
    out = out.replace(
      /<meta\s+property="og:type"\s+content="[^"]*"/,
      `<meta property="og:type" content="${opts.ogType}"`
    )
  }
  if (opts.ogImage) {
    out = out.replace(
      /<meta\s+property="og:image"\s+content="[^"]*"/,
      `<meta property="og:image" content="${opts.ogImage}"`
    )
    out = out.replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"/,
      `<meta name="twitter:image" content="${opts.ogImage}"`
    )
  }
  return out
}

function prerenderRoute(
  component: ReactElement,
  outRel: string,
  head: {
    title: string
    description: string
    canonical: string
    ogType?: string
    ogImage?: string
  },
  opts: { jsonLd?: boolean } = {}
) {
  const appHtml = renderToString(component)
  let html = baseTemplate.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  html = injectHead(html, head)

  if (opts.jsonLd) {
    const ld = [organizationJsonLd(), webSiteJsonLd(), mobileAppJsonLd(), faqJsonLd()]
      .map(jsonLdScript)
      .join('\n    ')
    html = html.replace('</head>', `    ${ld}\n  </head>`)
  }

  const outPath = path.join(dist, outRel)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, html)
  console.log(`✓ prerendered ${head.canonical} → ${outRel}`)
}

prerenderRoute(
  <LandingPage />,
  'index.html',
  { title: SEO_TITLE, description: SEO_DESCRIPTION, canonical: `${SITE_URL}/` },
  { jsonLd: true }
)

prerenderRoute(
  <StaticRouter location="/blog">
    <BlogListPage />
  </StaticRouter>,
  'blog/index.html',
  {
    title: 'Blog — Smono Quit Smoking Insights',
    description:
      'Articles on quitting smoking with CBT, craving management, and building a smoke-free life — from the Smono team.',
    canonical: `${SITE_URL}/blog`,
  }
)

const blogs = await fetchPublishedBlogs()
for (const blog of blogs) {
  const slug = blog.slug || blog.id
  if (!slug) continue
  const title = `${blog.title} | Smono Blog`
  const description = blogExcerpt(blog.content, blog.excerpt, 160)
  prerenderRoute(
    <StaticRouter location={`/blog/${slug}`}>
      <BlogDetailPage initialPost={blog} />
    </StaticRouter>,
    `blog/${slug}/index.html`,
    {
      title,
      description: description || SEO_DESCRIPTION,
      canonical: `${SITE_URL}/blog/${slug}`,
      ogType: 'article',
      ogImage: blog.image_url || `${SITE_URL}/smonologo.webp`,
    }
  )
}

if (blogs.length) {
  console.log(`✓ prerendered ${blogs.length} blog post(s) from PocketBase`)
}
