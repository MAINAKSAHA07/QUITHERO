import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BlogSiteChrome } from '../components/BlogSiteChrome'
import { getPublishedBlogs } from '../services/blogs'
import type { BlogPost } from '../types/blog'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { blogExcerpt } from '../utils/stripHtml'
import { resolveMediaUrl } from '../utils/mediaUrl'

function formatDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlogListPage() {
  useLandingInteractions()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPublishedBlogs()
      .then(setPosts)
      .catch(() => setError('Could not load blog posts. Please try again later.'))
      .finally(() => setLoading(false))
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
              return (
                <article key={post.id} className="blog-card">
                  {post.image_url && (
                    <Link to={`/blog/${slug}`} className="blog-card-image-wrap">
                      <img src={resolveMediaUrl(post.image_url)} alt={post.title} className="blog-card-image" loading="lazy" />
                    </Link>
                  )}
                  <div className="blog-card-body">
                    <p className="blog-card-meta">
                      {formatDate(post.published_at || post.created)}
                      {post.type && <span className="blog-card-type">{post.type}</span>}
                    </p>
                    <h2 className="blog-card-title">
                      <Link to={`/blog/${slug}`}>{post.title}</Link>
                    </h2>
                    <p className="blog-card-excerpt">
                      {blogExcerpt(post.content, post.excerpt)}
                    </p>
                    <Link to={`/blog/${slug}`} className="blog-card-link">
                      Read article →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </BlogSiteChrome>
  )
}
