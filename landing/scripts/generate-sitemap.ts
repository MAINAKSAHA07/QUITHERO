import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pageUrl } from '../src/lib/seo.config'
import { MARKETING_ROUTES } from '../src/pages/marketing'
import { fetchPublishedBlogs } from './fetch-published-blogs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(__dirname, '../dist/sitemap.xml')
const today = new Date().toISOString().slice(0, 10)

const blogs = await fetchPublishedBlogs()

const urls: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: pageUrl('/'), changefreq: 'weekly', priority: '1.0' },
  { loc: pageUrl('/about/'), changefreq: 'monthly', priority: '0.6' },
  ...MARKETING_ROUTES.map((r) => ({
    loc: pageUrl(r.path),
    changefreq: 'monthly',
    priority: r.slug === 'how-it-works' || r.slug === 'quit-smoking-program' ? '0.8' : '0.6',
  })),
  { loc: pageUrl('/blog/'), changefreq: 'weekly', priority: '0.8' },
  { loc: pageUrl('/privacy/'), changefreq: 'yearly', priority: '0.3' },
  { loc: pageUrl('/terms/'), changefreq: 'yearly', priority: '0.3' },
]

for (const blog of blogs) {
  const slug = blog.slug || blog.id
  if (!slug) continue
  urls.push({
    loc: pageUrl(`/blog/${slug}/`),
    changefreq: 'monthly',
    priority: '0.7',
  })
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, xml)
console.log(`✓ wrote sitemap (${urls.length} URLs)`)
