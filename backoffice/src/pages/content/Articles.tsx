import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Edit, Trash2, Copy, Eye, Search, Filter, FileText, Globe, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

interface Article {
  id: string
  title: string
  content?: string
  type?: string
  language?: string
  status?: string
  created?: string
  updated?: string
  [key: string]: any
}

export const Articles = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Note: This assumes a 'content_items' or 'articles' collection exists
  // Adjust collection name based on your PocketBase setup
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles', searchQuery, typeFilter, languageFilter, statusFilter],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('content_items', {
          filter: buildFilter(),
          sort: '-created',
        })
      } catch (error: any) {
        // If collection doesn't exist, return empty array
        if (error?.status === 404 || error?.message?.includes('not found')) {
          return { data: [] }
        }
        throw error
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('content_items', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })

  const buildFilter = () => {
    const filters: string[] = []
    if (searchQuery) {
      filters.push(`title ~ "${searchQuery}" || content ~ "${searchQuery}"`)
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
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const articles = articlesData?.data || []

  const handleDelete = async (article: Article) => {
    if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
      try {
        await deleteMutation.mutateAsync(article.id)
      } catch (error) {
        console.error('Failed to delete article:', error)
        alert('Failed to delete article')
      }
    }
  }

  const handleDuplicate = async (article: Article) => {
    try {
      const { id, created, updated, ...articleData } = article
      await adminCollectionHelpers.create('content_items', {
        ...articleData,
        title: `${article.title} (Copy)`,
        status: 'draft',
      })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    } catch (error) {
      console.error('Failed to duplicate article:', error)
      alert('Failed to duplicate article')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-dark">Articles</h1>
        <button
          onClick={() => navigate('/content/articles/add')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Article
        </button>
      </div>

      {/* Filters */}
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

      {/* Articles Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-2">No articles found</p>
          <p className="text-sm text-neutral-400 mb-4">
            {articlesData === undefined
              ? 'Articles collection may need to be created in PocketBase'
              : 'Create your first article to get started'}
          </p>
          <button
            onClick={() => navigate('/content/articles/add')}
            className="btn-primary"
          >
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
              {articles.map((article: Article) => (
                <tr key={article.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-dark">{article.title}</p>
                      {article.content && (
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                          {article.content.substring(0, 100)}...
                        </p>
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
                    <span className={`px-2 py-1 text-xs rounded ${
                      article.status === 'published' ? 'bg-success/10 text-success' :
                      article.status === 'draft' ? 'bg-warning/10 text-warning' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {article.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {article.created ? formatDistanceToNow(new Date(article.created), { addSuffix: true }) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {article.updated ? formatDistanceToNow(new Date(article.updated), { addSuffix: true }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/content/articles/${article.id}`)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-secondary" />
                      </button>
                      <button
                        onClick={() => navigate(`/content/articles/${article.id}/edit`)}
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
    </div>
  )
}
