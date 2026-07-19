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
import { LegalPage } from '../src/pages/LegalPage'
import { AboutPage } from '../src/pages/AboutPage'
import { MARKETING_ROUTES } from '../src/pages/marketing'
import {
  SEO_TITLE,
  SEO_DESCRIPTION,
  SITE_URL,
  OG_IMAGE,
  pageUrl,
  organizationJsonLd,
  webSiteJsonLd,
  softwareApplicationJsonLd,
  faqJsonLd,
} from '../src/lib/seo.config'

/** Social crawlers need absolute URLs; CMS often stores proxy-relative paths. */
function absoluteOgImage(url?: string): string {
  if (!url?.trim()) return OG_IMAGE
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return `${SITE_URL}${u}`
  return OG_IMAGE
}

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
  opts: { jsonLd?: boolean; bootstrap?: string } = {}
) {
  const appHtml = renderToString(component)
  let html = baseTemplate.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  html = injectHead(html, head)

  if (opts.jsonLd) {
    const ld = [
      organizationJsonLd(),
      webSiteJsonLd(),
      softwareApplicationJsonLd(),
      faqJsonLd(),
    ]
      .map(jsonLdScript)
      .join('\n    ')
    html = html.replace('</head>', `    ${ld}\n  </head>`)
  }

  if (opts.bootstrap) {
    html = html.replace(
      /<script type="module"/,
      `${opts.bootstrap}\n    <script type="module"`
    )
  }

  const outPath = path.join(dist, outRel)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, html)
  console.log(`✓ prerendered ${head.canonical} → ${outRel}`)
}

function blogBootstrap(id: string, data: unknown) {
  return `<script type="application/json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

function aboutJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Smono',
        url: SITE_URL,
        logo: `${SITE_URL}/smonologo.webp`,
        description:
          'Smono is a 30-day, CBT-based quit-smoking program designed to help people understand and reduce the psychological desire to smoke through personalized, compassionate behavioral support.',
        foundingDate: '2025-12',
        sameAs: [
          'https://www.instagram.com/smono.app',
          'https://www.linkedin.com/company/smono-app',
        ],
        founder: [
          { '@id': `${SITE_URL}/about/#pinnac` },
          { '@id': `${SITE_URL}/about/#mainak` },
        ],
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/about/#pinnac`,
        name: 'Pinnac Yeddy',
        jobTitle: 'Co-Founder & CEO',
        worksFor: { '@id': `${SITE_URL}/#organization` },
        sameAs: ['https://www.linkedin.com/in/pinnacyeddy/'],
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/about/#mainak`,
        name: 'Mainak Malay Saha',
        jobTitle: 'Co-Founder & CTO',
        worksFor: { '@id': `${SITE_URL}/#organization` },
        alumniOf: {
          '@type': 'Organization',
          name: 'Arizona State University',
        },
        url: 'https://mainaksaha.in/',
        sameAs: ['https://www.linkedin.com/in/mainaksaha08'],
      },
    ],
  }
}

prerenderRoute(
  <LandingPage />,
  'index.html',
  { title: SEO_TITLE, description: SEO_DESCRIPTION, canonical: pageUrl('/'), ogImage: OG_IMAGE },
  { jsonLd: true }
)

prerenderRoute(
  <StaticRouter location="/about">
    <AboutPage />
  </StaticRouter>,
  'about/index.html',
  {
    title: 'About Smono | Our Story, Team and Mission',
    description:
      'Meet the team behind Smono, a personalized 30-day CBT-based quit-smoking program built to help people understand triggers, reduce desire, and reclaim freedom.',
    canonical: pageUrl('/about/'),
  },
  { bootstrap: jsonLdScript(aboutJsonLd()) }
)

for (const route of MARKETING_ROUTES) {
  const { slug, path, title, description, Component } = route
  prerenderRoute(
    <StaticRouter location={path}>
      <Component />
    </StaticRouter>,
    `${slug}/index.html`,
    {
      title,
      description,
      canonical: pageUrl(path),
    }
  )
}

const blogs = await fetchPublishedBlogs()

prerenderRoute(
  <StaticRouter location="/blog">
    <BlogListPage initialPosts={blogs} />
  </StaticRouter>,
  'blog/index.html',
  {
    title: 'Blog — Smono Quit Smoking Insights',
    description:
      'Articles on quitting smoking with CBT, craving management, and building a smoke-free life — from the Smono team.',
    canonical: pageUrl('/blog/'),
  },
  { bootstrap: blogBootstrap('smono-blog-list', blogs) }
)

prerenderRoute(
  <StaticRouter location="/privacy">
    <LegalPage kind="privacy" />
  </StaticRouter>,
  'privacy/index.html',
  {
    title: 'Privacy Policy — Smono',
    description:
      'How Smono collects, uses, and deletes personal data for the quit-smoking program.',
    canonical: pageUrl('/privacy/'),
  }
)

prerenderRoute(
  <StaticRouter location="/terms">
    <LegalPage kind="terms" />
  </StaticRouter>,
  'terms/index.html',
  {
    title: 'Terms of Service — Smono',
    description:
      'Terms of use for Smono, including the health disclaimer for this behavioural quit-smoking program.',
    canonical: pageUrl('/terms/'),
  }
)

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
      canonical: pageUrl(`/blog/${slug}/`),
      ogType: 'article',
      ogImage: absoluteOgImage(blog.image_url),
    },
    { bootstrap: blogBootstrap('smono-blog-post', blog) }
  )
}

if (blogs.length) {
  console.log(`✓ prerendered ${blogs.length} blog post(s) from PocketBase`)
}
