import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BlogBody } from '../components/BlogBody'
import { BlogShare } from '../components/BlogShare'
import { BlogSiteChrome } from '../components/BlogSiteChrome'
import { getBlogBySlug } from '../services/blogs'
import type { BlogPost } from '../types/blog'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { resolveMediaUrl } from '../utils/mediaUrl'

function formatDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type ArticleViewProps = { post: BlogPost; slug: string }

export function BlogArticleView({ post, slug }: ArticleViewProps) {
  return (
    <article className="blog-article">
      <div className="container blog-article-inner">
        <Link to="/blog" className="blog-back">
          ← All posts
        </Link>
        <div className="blog-article-meta-row">
          <p className="blog-card-meta">
            {formatDate(post.published_at || post.created)}
            {post.type && <span className="blog-card-type">{post.type}</span>}
          </p>
          <BlogShare title={post.title} slug={slug} excerpt={post.excerpt} />
        </div>
        <h1 className="blog-article-title">{post.title}</h1>
        {post.excerpt && <p className="blog-article-excerpt">{post.excerpt}</p>}
        {post.image_url && (
          <img
            src={resolveMediaUrl(post.image_url)}
            alt={post.title}
            className="blog-article-image"
          />
        )}
        <BlogBody content={post.content || ''} />
        <BlogShare title={post.title} slug={slug} excerpt={post.excerpt} variant="bar" />
      </div>
    </article>
  )
}

type PageProps = { initialPost?: BlogPost }

export function BlogDetailPage({ initialPost }: PageProps) {
  useLandingInteractions()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(initialPost ?? null)
  const [loading, setLoading] = useState(!initialPost)

  useEffect(() => {
    if (initialPost) return
    if (!slug) {
      navigate('/blog', { replace: true })
      return
    }
    getBlogBySlug(slug)
      .then((row) => {
        if (!row) {
          navigate('/blog', { replace: true })
          return
        }
        setPost(row)
        document.title = `${row.title} | Smono Blog`
      })
      .catch(() => navigate('/blog', { replace: true }))
      .finally(() => setLoading(false))
  }, [slug, navigate, initialPost])

  if (loading) {
    return (
      <BlogSiteChrome>
        <div className="container blog-status">Loading…</div>
      </BlogSiteChrome>
    )
  }

  if (!post) return null

  const postSlug = slug || post.slug || post.id

  return (
    <BlogSiteChrome>
      <BlogArticleView post={post} slug={postSlug} />
    </BlogSiteChrome>
  )
}
