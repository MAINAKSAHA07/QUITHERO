import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { Plus, Edit, Trash2, Copy, Eye, Search, FileText, Globe, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { MediaUrlField } from '../../components/MediaUrlField'

interface Article {
  id: string
  title: string
  slug?: string
  excerpt?: string
  content?: string
  type?: string
  language?: string
  status?: string
  image_url?: string
  published_at?: string
  is_active?: boolean
  created?: string
  updated?: string
  [key: string]: any
}

const ARTICLE_TYPES = ['article', 'blog', 'guide'] as const

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const Articles = () => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null)

  const buildFilter = () => {
    const filters: string[] = [`(type = "article" || type = "blog" || type = "guide")`]
    if (searchQuery) {
      filters.push(`(title ~ "${searchQuery}" || content ~ "${searchQuery}" || excerpt ~ "${searchQuery}")`)
    }
    if (typeFilter !== 'all') {
      filters.push(`type = "${typeFilter}"`)
    }
    if (languageFilter !== 'all') {
      filters.push(`language = "${languageFilter}"`)
    }
    if (statusFilter !== 'all') {
      filters.push(`status = "${statusFilter}"`)
    }
    return filters.join(' && ')
  }

  const { data: articlesData, isLoading, isError, error } = useQuery({
    queryKey: ['articles', searchQuery, typeFilter, languageFilter, statusFilter],
    queryFn: () =>
      adminCollectionHelpers.getFullList('content_items', {
        filter: buildFilter(),
        sort: recentSort('content_items'),
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCollectionHelpers.delete('content_items', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  })

  const articles = articlesData?.success ? articlesData.data || [] : []

  const handleDelete = async (article: Article) => {
    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) return
    const result = await deleteMutation.mutateAsync(article.id)
    if (!result.success) {
      alert(result.error || 'Failed to delete article')
    }
  }

  const handleDuplicate = async (article: Article) => {
    const { id, created, updated, ...articleData } = article
    const result = await adminCollectionHelpers.create('content_items', {
      ...articleData,
      title: `${article.title} (Copy)`,
      status: 'draft',
    })
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    } else {
      alert(result.error || 'Failed to duplicate article')
    }
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingArticle(null)
    setViewingArticle(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-dark">Articles &amp; Blog</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Article
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="article">Article</option>
            <option value="blog">Blog Post</option>
            <option value="guide">Guide</option>
          </select>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="hi">Hindi</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      ) : isError || articlesData?.success === false ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-2">Could not load articles</p>
          <p className="text-sm text-neutral-400">
            {(error as Error)?.message ||
              (articlesData && !articlesData.success ? articlesData.error : undefined) ||
              'Check PocketBase content_items collection and admin permissions'}
          </p>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-2">No articles found</p>
          <p className="text-sm text-neutral-400 mb-4">Create your first article to get started</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            Create Article
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Last Modified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {(articles as unknown as Article[]).map((article) => (
                <tr key={article.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-dark">{article.title}</p>
                      {article.slug && article.status === 'published' && (
                        <p className="text-xs text-primary mt-1 font-mono">/blog/{article.slug}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-neutral-100 rounded capitalize">
                      {article.type || 'article'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm">{article.language?.toUpperCase() || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        article.status === 'published'
                          ? 'bg-success/10 text-success'
                          : article.status === 'draft'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {article.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {article.created
                        ? formatDistanceToNow(new Date(article.created), { addSuffix: true })
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {article.updated
                      ? formatDistanceToNow(new Date(article.updated), { addSuffix: true })
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingArticle(article)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-secondary" />
                      </button>
                      <button
                        onClick={() => setEditingArticle(article)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(article)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(article)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showAddModal || editingArticle) && (
        <ArticleModal
          article={editingArticle}
          onClose={closeModal}
          onSuccess={() => {
            closeModal()
            queryClient.invalidateQueries({ queryKey: ['articles'] })
          }}
        />
      )}

      {viewingArticle && (
        <ArticleViewModal article={viewingArticle} onClose={() => setViewingArticle(null)} />
      )}
    </div>
  )
}

interface ArticleModalProps {
  article?: Article | null
  onClose: () => void
  onSuccess: () => void
}

const ArticleModal = ({ article, onClose, onSuccess }: ArticleModalProps) => {
  const [slugTouched, setSlugTouched] = useState(!!article?.slug)
  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    excerpt: article?.excerpt || '',
    content: article?.content || '',
    type: article?.type || 'blog',
    language: article?.language || 'en',
    status: article?.status || 'draft',
    image_url: article?.image_url || '',
    is_active: article?.is_active !== undefined ? article.is_active : true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }
    if (!ARTICLE_TYPES.includes(formData.type as (typeof ARTICLE_TYPES)[number])) {
      alert('Invalid article type')
      return
    }

    const slug = (formData.slug || slugify(formData.title)).trim()
    if (!slug) {
      alert('URL slug is required')
      return
    }

    setIsSubmitting(true)
    try {
      const publishedAt =
        formData.status === 'published'
          ? article?.published_at || new Date().toISOString()
          : undefined

      const payload = {
        title: formData.title.trim(),
        slug,
        excerpt: formData.excerpt.trim() || undefined,
        content: formData.content.trim(),
        type: formData.type,
        language: formData.language,
        status: formData.status,
        image_url: formData.image_url.trim() || undefined,
        is_active: formData.is_active,
        ...(publishedAt ? { published_at: publishedAt } : {}),
      }

      const result = article
        ? await adminCollectionHelpers.update('content_items', article.id, payload)
        : await adminCollectionHelpers.create('content_items', payload)

      if (!result.success) {
        alert(result.error || 'Failed to save article')
        return
      }
      onSuccess()
    } catch (err: any) {
      alert(err?.message || 'Failed to save article')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">{article ? 'Edit Article' : 'Create Article'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              URL slug <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setFormData({ ...formData, slug: slugify(e.target.value) })
              }}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="my-quit-story"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">Landing URL: /blog/{formData.slug || 'your-slug'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={2}
              maxLength={300}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Short summary for blog cards (max 300 chars)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={15}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="Write your blog content in HTML..."
            />
            <p className="text-xs text-neutral-500 mt-1">Supports HTML formatting (headings, lists, links, images).</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="article">Article</option>
                <option value="blog">Blog Post</option>
                <option value="guide">Guide</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <MediaUrlField
            label="Cover image (optional)"
            value={formData.image_url}
            onChange={(image_url) => setFormData({ ...formData, image_url })}
            mediaType="image"
            folder="blog"
            placeholder="https://... or upload below"
            hint="Upload a cover image or paste an external URL. HTML blog content can also include inline images."
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <label htmlFor="is_active" className="text-sm text-neutral-700">
              Active (visible on landing blog when published)
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : article ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ArticleViewModal = ({ article, onClose }: { article: Article; onClose: () => void }) => {
  const isHtml = /<[a-z][\s\S]*>/i.test(article.content || '')
  return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div
      className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
        <h2 className="text-xl font-semibold">{article.title}</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
          ✕
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-2 py-1 bg-neutral-100 rounded capitalize">{article.type || 'article'}</span>
          <span className="px-2 py-1 bg-neutral-100 rounded uppercase">{article.language || 'en'}</span>
          <span className="px-2 py-1 bg-neutral-100 rounded capitalize">{article.status || 'draft'}</span>
        </div>
        {article.image_url && (
          <img src={article.image_url} alt="" className="rounded-lg max-h-48 object-cover w-full" />
        )}
        {isHtml ? (
          <div
            className="prose prose-sm max-w-none text-neutral-700"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-neutral-700">
            {article.content || <span className="text-neutral-400">No content</span>}
          </div>
        )}
      </div>
    </div>
  </div>
  )
}
