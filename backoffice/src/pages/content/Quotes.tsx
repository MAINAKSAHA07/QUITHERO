import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Edit, Trash2, Upload, Search, MessageSquare, Lightbulb, ToggleLeft, ToggleRight } from 'lucide-react'

interface Quote {
  id: string
  type?: string
  content: string
  author?: string
  language?: string
  is_active?: boolean
  [key: string]: any
}

export const Quotes = () => {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Note: This assumes a 'quotes' or 'content_items' collection with type='quote' or 'tip'
  // Adjust based on your PocketBase schema
  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['quotes', typeFilter, languageFilter, searchQuery],
    queryFn: async () => {
      try {
        // Try quotes collection first
        return await adminCollectionHelpers.getFullList('quotes', {
          filter: buildFilter(),
          sort: '-created',
        })
      } catch (error: any) {
        // Fallback to content_items if quotes collection doesn't exist
        if (error?.status === 404 || error?.message?.includes('not found')) {
          try {
            return await adminCollectionHelpers.getFullList('content_items', {
              filter: `(type = "quote" || type = "tip") && ${buildFilter() || '1=1'}`,
              sort: '-created',
            })
          } catch {
            return { data: [] }
          }
        }
        throw error
      }
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      try {
        return await adminCollectionHelpers.update('quotes', id, { is_active: isActive })
      } catch {
        return await adminCollectionHelpers.update('content_items', id, { is_active: isActive })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        return await adminCollectionHelpers.delete('quotes', id)
      } catch {
        return await adminCollectionHelpers.delete('content_items', id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })

  const buildFilter = () => {
    const filters: string[] = []
    if (searchQuery) {
      filters.push(`content ~ "${searchQuery}"`)
    }
    if (typeFilter !== 'all') {
      filters.push(`type = "${typeFilter}"`)
    }
    if (languageFilter !== 'all') {
      filters.push(`language = "${languageFilter}"`)
    }
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const quotes = quotesData?.data || []

  const handleToggleActive = async (quote: Quote) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: quote.id,
        isActive: !quote.is_active,
      })
    } catch (error) {
      console.error('Failed to toggle quote status:', error)
      alert('Failed to update quote status')
    }
  }

  const handleDelete = async (quote: Quote) => {
    if (confirm(`Are you sure you want to delete this ${quote.type || 'quote'}?`)) {
      try {
        await deleteMutation.mutateAsync(quote.id)
      } catch (error) {
        console.error('Failed to delete quote:', error)
        alert('Failed to delete quote')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-neutral-dark">Quotes & Tips</h1>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Quote/Tip
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quotes and tips..."
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
            <option value="quote">Quotes</option>
            <option value="tip">Tips</option>
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
        </div>
      </div>

      {/* Quotes Grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No quotes or tips found</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Add First Quote
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(quotes as any as Quote[]).map((quote: Quote) => (
            <div key={quote.id} className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {quote.type === 'tip' ? (
                    <Lightbulb className="w-5 h-5 text-warning" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-primary" />
                  )}
                  <span className={`px-2 py-1 text-xs rounded ${
                    quote.type === 'tip' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                  }`}>
                    {quote.type === 'tip' ? 'Tip' : 'Quote'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleActive(quote)}
                  disabled={toggleActiveMutation.isPending}
                >
                  {quote.is_active ? (
                    <ToggleRight className="w-5 h-5 text-success" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-neutral-400" />
                  )}
                </button>
              </div>
              <blockquote className="text-lg font-medium text-neutral-dark mb-3 italic">
                "{quote.content}"
              </blockquote>
              {quote.author && (
                <p className="text-sm text-neutral-500 text-right">— {quote.author}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                <span className="text-xs text-neutral-500">
                  {quote.language?.toUpperCase() || 'N/A'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingQuote(quote)}
                    className="p-2 hover:bg-neutral-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-primary" />
                  </button>
                  <button
                    onClick={() => handleDelete(quote)}
                    className="p-2 hover:bg-neutral-100 rounded-lg"
                    title="Delete"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-danger" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Quote Modal */}
      {(showAddModal || editingQuote) && (
        <QuoteModal
          quote={editingQuote}
          onClose={() => {
            setShowAddModal(false)
            setEditingQuote(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingQuote(null)
            queryClient.invalidateQueries({ queryKey: ['quotes'] })
          }}
        />
      )}
    </div>
  )
}

interface QuoteModalProps {
  quote?: Quote | null
  onClose: () => void
  onSuccess: () => void
}

const QuoteModal: React.FC<QuoteModalProps> = ({ quote, onClose, onSuccess }) => {
  // const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    type: quote?.type || 'quote',
    content: quote?.content || '',
    author: quote?.author || '',
    language: quote?.language || 'en',
    is_active: quote?.is_active !== undefined ? quote.is_active : true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await adminCollectionHelpers.create('quotes', data)
      } catch {
        return await adminCollectionHelpers.create('content_items', {
          ...data,
          title: data.type === 'tip' ? 'Tip' : 'Quote',
        })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await adminCollectionHelpers.update('quotes', quote!.id, data)
      } catch {
        return await adminCollectionHelpers.update('content_items', quote!.id, data)
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim()) {
      alert('Content is required')
      return
    }

    const maxLength = formData.type === 'quote' ? 280 : 500
    if (formData.content.length > maxLength) {
      alert(`${formData.type === 'quote' ? 'Quote' : 'Tip'} must be ${maxLength} characters or less`)
      return
    }

    setIsSubmitting(true)
    try {
      if (quote) {
        await updateMutation.mutateAsync(formData)
      } else {
        await createMutation.mutateAsync(formData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save quote:', error)
      alert(error?.error || 'Failed to save quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{quote ? 'Edit Quote/Tip' : 'Add New Quote/Tip'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="quote"
                  checked={formData.type === 'quote'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-primary"
                />
                <span>Quote</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="tip"
                  checked={formData.type === 'tip'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="text-primary"
                />
                <span>Tip</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Content <span className="text-danger">*</span>
              <span className="text-xs text-neutral-500 ml-2">
                ({formData.content.length}/{formData.type === 'quote' ? 280 : 500} characters)
              </span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              maxLength={formData.type === 'quote' ? 280 : 500}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              placeholder={formData.type === 'quote' ? 'Enter quote...' : 'Enter tip...'}
            />
          </div>
          {formData.type === 'quote' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Author (optional)</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Author name"
              />
            </div>
          )}
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <label htmlFor="is_active" className="text-sm text-neutral-700">
              Active (visible to users)
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : quote ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
