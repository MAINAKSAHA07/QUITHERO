import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Search, AlertTriangle, User, Calendar, FileText, CheckCircle, XCircle, Mail, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export const FlaggedJournals = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [flagReasonFilter, setFlagReasonFilter] = useState<string>('all')
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all')

  // Note: This assumes journal entries can be flagged
  // You may need to add a 'flagged' or 'flag_reason' field to the journal_entries collection
  const { data: journalsData, isLoading } = useQuery({
    queryKey: ['journal_entries', 'flagged', flagReasonFilter, reviewStatusFilter],
    queryFn: async () => {
      try {
        // Try to filter flagged journal entries
        // Adjust filter based on your schema
        return await adminCollectionHelpers.getFullList('journal_entries', {
          filter: buildFilter(),
          sort: '-date',
          expand: 'user',
        })
      } catch (error: any) {
        return { data: [] }
      }
    },
  })

  const buildFilter = () => {
    // Placeholder - adjust based on your actual schema
    // You might check for flagged field, or search for concerning keywords
    const filters: string[] = []
    
    if (flagReasonFilter !== 'all') {
      // Add flag reason filter if you have that field
    }
    
    if (reviewStatusFilter !== 'all') {
      // Add review status filter if you have that field
    }
    
    // For now, return all entries (you'd filter for flagged ones)
    return undefined
  }

  const markSafeMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.update('journal_entries', id, {
        reviewed: true,
        review_status: 'safe',
        reviewed_at: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('journal_entries', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] })
    },
  })

  const journals = journalsData?.data || []
  
  // Filter for entries that might contain concerning content
  // In a real implementation, you'd check for flagged field or keywords
  const flaggedJournals = journals.filter((entry: any) => {
    // Placeholder: Check for concerning keywords (you'd implement proper keyword detection)
    const concerningKeywords = ['suicide', 'self-harm', 'hurt myself', 'end it']
    const content = (entry.content || '').toLowerCase()
    return concerningKeywords.some(keyword => content.includes(keyword)) || entry.flagged === true
  })

  const handleMarkSafe = async (entryId: string) => {
    try {
      await markSafeMutation.mutateAsync(entryId)
    } catch (error) {
      console.error('Failed to mark as safe:', error)
      alert('Failed to update entry status')
    }
  }

  const handleDelete = async (entry: any) => {
    if (confirm(`Are you sure you want to delete this journal entry? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(entry.id)
      } catch (error) {
        console.error('Failed to delete entry:', error)
        alert('Failed to delete entry')
      }
    }
  }

  const handleContactUser = (userId: string) => {
    navigate(`/support/tickets?user=${userId}`)
  }

  const highlightKeywords = (text: string) => {
    const keywords = ['suicide', 'self-harm', 'hurt myself', 'end it']
    let highlighted = text
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark class="bg-danger/20 text-danger">$1</mark>')
    })
    return highlighted
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold text-neutral-dark">Flagged Journal Entries</h1>
          <p className="text-neutral-500 mt-1">Review journal entries that may contain concerning content</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user name, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={flagReasonFilter}
            onChange={(e) => setFlagReasonFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Reasons</option>
            <option value="keywords">Concerning Keywords</option>
            <option value="user_reported">User Reported</option>
            <option value="admin_flagged">Admin Flagged</option>
          </select>
          <select
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="actioned">Actioned</option>
          </select>
        </div>
      </div>

      {/* Flagged Entries List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : flaggedJournals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No flagged journal entries found</p>
          <p className="text-sm text-neutral-400 mt-2">
            Entries containing concerning keywords or flagged by system/admin will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedJournals
            .filter((entry: any) => {
              if (!searchQuery) return true
              const searchLower = searchQuery.toLowerCase()
              const user = entry.expand?.user
              return (
                user?.name?.toLowerCase().includes(searchLower) ||
                user?.email?.toLowerCase().includes(searchLower) ||
                entry.content?.toLowerCase().includes(searchLower) ||
                entry.title?.toLowerCase().includes(searchLower)
              )
            })
            .map((entry: any) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-card p-6 border-l-4 border-danger"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                      {entry.expand?.user?.name?.[0]?.toUpperCase() || entry.expand?.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-dark">
                        {entry.expand?.user?.name || entry.expand?.user?.email || 'Unknown User'}
                      </p>
                      <button
                        onClick={() => navigate(`/users/${entry.expand?.user?.id}`)}
                        className="text-sm text-primary hover:underline"
                      >
                        View Profile →
                      </button>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs bg-danger/10 text-danger rounded font-medium">
                    Flagged
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-neutral-500">Date</label>
                    <p className="font-medium text-sm">
                      {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Mood</label>
                    <p className="font-medium text-2xl">
                      {entry.mood === 'very_happy' ? '😊' :
                       entry.mood === 'happy' ? '🙂' :
                       entry.mood === 'neutral' ? '😐' :
                       entry.mood === 'sad' ? '😔' :
                       entry.mood === 'very_sad' ? '😢' : '😐'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Flag Reason</label>
                    <p className="font-medium text-sm text-danger">Concerning Keywords</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Review Status</label>
                    <p className="font-medium text-sm">
                      {entry.review_status || 'Pending'}
                    </p>
                  </div>
                </div>

                {entry.title && (
                  <div className="mb-3">
                    <label className="text-xs text-neutral-500 mb-1 block">Title</label>
                    <p className="font-semibold text-neutral-dark">{entry.title}</p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="text-xs text-neutral-500 mb-1 block">Content</label>
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p
                      className="text-sm text-neutral-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: highlightKeywords(entry.content || '')
                      }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-neutral-500 mb-1 block">Admin Notes</label>
                  <textarea
                    placeholder="Add admin notes..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
                  <button
                    onClick={() => handleContactUser(entry.expand?.user?.id)}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Contact User
                  </button>
                  <button
                    onClick={() => handleMarkSafe(entry.id)}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Safe
                  </button>
                  <button className="btn-secondary text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Mark for Follow-up
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="btn-danger text-sm flex items-center gap-2"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Entry
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
