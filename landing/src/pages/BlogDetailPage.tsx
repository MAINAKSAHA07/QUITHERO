import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BlogBody } from '../components/BlogBody'
import { BlogShare } from '../components/BlogShare'
import { BlogSiteChrome } from '../components/BlogSiteChrome'
import { getBlogBySlug } from '../services/blogs'
import type { BlogPost } from '../types/blog'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { usePageSeo } from '../hooks/usePageSeo'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { isFullHtmlDocument } from '../utils/prepareBlogHtml'
import { readPrerenderedBlogPost } from '../utils/prerenderData'
import { SEO_DESCRIPTION } from '../lib/seo.config'
import { blogExcerpt } from '../utils/stripHtml'
import { displayBlogTitle, displayBlogType } from '../utils/blogDisplay'

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
  const fullDoc = isFullHtmlDocument(post.content || '')
  const title = displayBlogTitle(post.title)
  const typeLabel = displayBlogType(post.type)

  return (
    <article className={`blog-article${fullDoc ? ' blog-article--full' : ''}`}>
      <div className={`container blog-article-inner${fullDoc ? ' blog-article-inner--full' : ''}`}>
        <Link to="/blog" className="blog-back">
          ← All posts
        </Link>
        <div className="blog-article-meta-row">
          <p className="blog-card-meta">
            {formatDate(post.published_at || post.created)}
            {typeLabel && <span className="blog-card-type">{typeLabel}</span>}
          </p>
          <BlogShare title={title} slug={slug} excerpt={post.excerpt} />
        </div>

        {/* Full HTML posts ship their own title / standfirst — skip duplicates */}
        {!fullDoc && (
          <>
            <h1 className="blog-article-title">{title}</h1>
            {post.excerpt && <p className="blog-article-excerpt">{post.excerpt}</p>}
          </>
        )}

        {/* CMS cover — full HTML posts have no <img> in body, only image_url */}
        {post.image_url && (
          <img
            src={resolveMediaUrl(post.image_url)}
            alt=""
            className={`blog-article-image${fullDoc ? ' blog-article-image--full' : ''}`}
          />
        )}
        <BlogBody content={post.content || ''} />
        <BlogShare title={title} slug={slug} excerpt={post.excerpt} variant="bar" />
      </div>
    </article>
  )
}

type PageProps = { initialPost?: BlogPost }

export function BlogDetailPage({ initialPost }: PageProps) {
  useLandingInteractions()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const seeded = initialPost ?? readPrerenderedBlogPost()
  const [post, setPost] = useState<BlogPost | null>(seeded ?? null)
  const [loading, setLoading] = useState(!seeded)
  const seoSlug = slug || seeded?.slug || seeded?.id || ''
  const seoTitle = post
    ? `${displayBlogTitle(post.title)} | Smono Blog`
    : 'Smono Blog'
  const seoDescription = post ? blogExcerpt(post.content, post.excerpt, 160) || SEO_DESCRIPTION : SEO_DESCRIPTION
  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: seoSlug ? `/blog/${seoSlug}/` : '/blog/',
  })

  useEffect(() => {
    if (!slug) {
      navigate('/blog', { replace: true })
      return
    }
    // Use prerender when it matches this slug; otherwise always fetch (new posts after deploy)
    if (seeded && (seeded.slug === slug || seeded.id === slug)) {
      setPost(seeded)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getBlogBySlug(slug)
      .then((row) => {
        if (cancelled) return
        if (!row) {
          navigate('/blog', { replace: true })
          return
        }
        setPost(row)
      })
      .catch(() => {
        if (!cancelled) navigate('/blog', { replace: true })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, navigate, seeded])

  if (loading) {
    return (
      <BlogSiteChrome>
        <div className="container blog-status blog-status--detail" role="status">
          Loading article…
        </div>
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
