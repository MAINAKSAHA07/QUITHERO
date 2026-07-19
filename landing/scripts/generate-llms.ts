/**
 * Build-time llms.txt + llms-full.txt for AI assistants (https://llmstxt.org).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  APP_URL,
  FAQ_ITEMS,
  PROGRAM_FRAMING,
  SEO_DESCRIPTION,
  SITE_URL,
  pageUrl,
} from '../src/lib/seo.config'
import { MARKETING_ROUTES } from '../src/pages/marketing'
import { blogExcerpt } from '../src/utils/stripHtml'
import { fetchPublishedBlogs } from './fetch-published-blogs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, '../dist')

type LinkItem = { title: string; url: string; note: string }

const CORE_LINKS: LinkItem[] = [
  {
    title: 'Home',
    url: pageUrl('/'),
    note: 'Personalised quit-smoking app: remove the desire to smoke in 10 days, then 20 days of support.',
  },
  {
    title: 'How It Works',
    url: pageUrl('/how-it-works/'),
    note: 'Step-by-step 10-day quit path plus 20 days of smoke-free support.',
  },
  {
    title: 'The Smono Method',
    url: pageUrl('/method/'),
    note: 'CBT, mindfulness, habit psychology, and relapse-prevention approach.',
  },
  {
    title: 'Quit Smoking Program',
    url: pageUrl('/quit-smoking-program/'),
    note: '30-day personalized program overview: who it is for and how it compares.',
  },
  {
    title: 'Languages',
    url: pageUrl('/languages/'),
    note: 'English, Hindi, Marathi, Gujarati, Spanish, French, German, Italian, Chinese.',
  },
  {
    title: 'Pricing',
    url: pageUrl('/pricing/'),
    note: 'Complete program pricing; billed monthly, most people need one month.',
  },
  {
    title: 'About Smono',
    url: pageUrl('/about/'),
    note: 'Founders, mission, and why Smono was built.',
  },
  {
    title: 'Blog',
    url: pageUrl('/blog/'),
    note: 'Articles on quitting smoking, cravings, CBT, and staying smoke-free.',
  },
]

const OPTIONAL_LINKS: LinkItem[] = [
  {
    title: 'Privacy Policy',
    url: pageUrl('/privacy/'),
    note: 'How personal data is collected, used, and deleted.',
  },
  {
    title: 'Terms of Service',
    url: pageUrl('/terms/'),
    note: 'Program terms and health disclaimer.',
  },
  {
    title: 'Editorial Policy',
    url: pageUrl('/editorial-policy/'),
    note: 'How program and educational content is created and reviewed.',
  },
  {
    title: 'Medical Disclaimer',
    url: pageUrl('/medical-disclaimer/'),
    note: 'Smono is behavioural support, not medical treatment.',
  },
  {
    title: 'Start the app',
    url: `${APP_URL}/language`,
    note: 'Open the Smono web app (account required for the program).',
  },
  {
    title: 'Full site context (llms-full.txt)',
    url: `${SITE_URL}/llms-full.txt`,
    note: 'Single-file Markdown with program facts, FAQ, and page summaries.',
  },
]

function linkLines(items: LinkItem[]) {
  return items.map((i) => `- [${i.title}](${i.url}): ${i.note}`).join('\n')
}

function buildLlmsTxt(blogLinks: LinkItem[]) {
  return `# Smono

> ${SEO_DESCRIPTION}

Smono (${SITE_URL}) is a personalised quit-smoking program: ${PROGRAM_FRAMING}.
It uses CBT, mindfulness, trigger mapping, and relapse prevention — without nicotine gums, patches, or vapes.
Contact: support@smono.app · App: ${APP_URL}

## Core pages

${linkLines(CORE_LINKS)}

## Blog

${blogLinks.length ? linkLines(blogLinks) : '- [Blog](' + pageUrl('/blog/') + '): Quit-smoking insights from the Smono team.'}

## Optional

${linkLines(OPTIONAL_LINKS)}
`
}

function buildLlmsFull(blogSections: string[]) {
  const marketingBody = MARKETING_ROUTES.map(
    (r) => `## ${r.title}\n\nURL: ${pageUrl(r.path)}\n\n${r.description}\n`
  ).join('\n')

  const faqBody = FAQ_ITEMS.map((item) => `### ${item.question}\n\n${item.answer}\n`).join('\n')

  return `# Smono — full site context for AI assistants

> ${SEO_DESCRIPTION}

This file is a single-fetch companion to ${SITE_URL}/llms.txt.
Prefer linking users to canonical pages on ${SITE_URL} when citing Smono.

## Product summary

- Product name: Smono
- Website: ${SITE_URL}
- App: ${APP_URL}
- Framing: ${PROGRAM_FRAMING}
- Approach: CBT, mindfulness, habit psychology, trigger mapping, relapse prevention
- Not medical treatment; not nicotine replacement therapy
- Languages: English, Hindi, Marathi, Gujarati, Spanish, French, German, Italian, Chinese
- Support: support@smono.app

## Core pages

${linkLines(CORE_LINKS)}

${marketingBody}

## About

URL: ${pageUrl('/about/')}

Smono helps people understand and reduce the desire to smoke through personalized, compassionate behavioural support.
Founded December 2025. Co-founders: Pinnac Yeddy (CEO) and Mainak Malay Saha (CTO).

## Frequently asked questions

${faqBody}

## Blog posts

${blogSections.length ? blogSections.join('\n') : '_No published posts available at build time._'}

## Legal and policy

${linkLines(OPTIONAL_LINKS.filter((l) => !l.url.includes('llms-full') && !l.url.includes(APP_URL)))}
`
}

const blogs = await fetchPublishedBlogs()

const blogLinks: LinkItem[] = []
const blogSections: string[] = []

for (const blog of blogs) {
  const slug = blog.slug || blog.id
  if (!slug) continue
  const title = (blog.title || slug).trim()
  const url = pageUrl(`/blog/${slug}/`)
  const excerpt = blogExcerpt(blog.content, blog.excerpt, 220) || 'Smono blog article.'
  blogLinks.push({ title, url, note: excerpt })
  blogSections.push(`### ${title}\n\nURL: ${url}\n\n${excerpt}\n`)
}

const llmsTxt = buildLlmsTxt(blogLinks)
const llmsFull = buildLlmsFull(blogSections)

fs.mkdirSync(dist, { recursive: true })
fs.writeFileSync(path.join(dist, 'llms.txt'), llmsTxt)
fs.writeFileSync(path.join(dist, 'llms-full.txt'), llmsFull)
console.log(`✓ wrote llms.txt + llms-full.txt (${blogLinks.length} blog links)`)
