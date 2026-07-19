import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BlogSiteChrome } from '../components/BlogSiteChrome'
import { getPublishedBlogs } from '../services/blogs'
import type { BlogPost } from '../types/blog'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { usePageSeo } from '../hooks/usePageSeo'
import { blogExcerpt } from '../utils/stripHtml'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { readPrerenderedBlogList } from '../utils/prerenderData'
import { displayBlogTitle, displayBlogType } from '../utils/blogDisplay'

function formatDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type Props = { initialPosts?: BlogPost[] }

export function BlogListPage({ initialPosts }: Props) {
  useLandingInteractions()
  usePageSeo({
    title: 'Blog — Smono Quit Smoking Insights',
    description:
      'Articles on quitting smoking with CBT, craving management, and building a smoke-free life — from the Smono team.',
    canonicalPath: '/blog/',
  })
  const seeded = initialPosts ?? readPrerenderedBlogList()
  const [posts, setPosts] = useState<BlogPost[]>(seeded ?? [])
  const [loading, setLoading] = useState(seeded === undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    // ponytail: prerender seeds first paint; always refresh so newly published posts show without redeploy
    let cancelled = false
    getPublishedBlogs()
      .then((rows) => {
        if (!cancelled) setPosts(rows)
      })
      .catch(() => {
        if (!cancelled && seeded === undefined) {
          setError('Could not load blog posts. Please try again later.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only refresh
  }, [])

  return (
    <BlogSiteChrome>
      <section className="blog-hero">
        <div className="container">
          <p className="blog-eyebrow">Smono Blog</p>
          <h1 className="blog-title">Quit-smoking insights &amp; stories</h1>
          <p className="blog-lead">
            Practical guidance on cravings, mindset, and building a smoke-free life — managed by our team.
          </p>
        </div>
      </section>

      <section className="blog-list-section">
        <div className="container">
          {loading && <p className="blog-status">Loading posts…</p>}
          {error && <p className="blog-status blog-status-error">{error}</p>}
          {!loading && !error && posts.length === 0 && (
            <p className="blog-status">No posts published yet. Check back soon.</p>
          )}
          <div className="blog-grid">
            {posts.map((post) => {
              const slug = post.slug || post.id
              const title = displayBlogTitle(post.title)
              const typeLabel = displayBlogType(post.type)
              return (
                <article key={post.id} className="blog-card">
                  <Link to={`/blog/${slug}`} className="blog-card-hit" aria-label={title}>
                    {post.image_url && (
                      <span className="blog-card-image-wrap">
                        <img
                          src={resolveMediaUrl(post.image_url)}
                          alt=""
                          className="blog-card-image"
                          loading="lazy"
                        />
                      </span>
                    )}
                    <span className="blog-card-body">
                      <span className="blog-card-meta">
                        {formatDate(post.published_at || post.created)}
                        {typeLabel && <span className="blog-card-type">{typeLabel}</span>}
                      </span>
                      <h2 className="blog-card-title">{title}</h2>
                      <p className="blog-card-excerpt">{blogExcerpt(post.content, post.excerpt)}</p>
                      <span className="blog-card-link" aria-hidden="true">
                        Read article
                      </span>
                    </span>
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </BlogSiteChrome>
  )
}
