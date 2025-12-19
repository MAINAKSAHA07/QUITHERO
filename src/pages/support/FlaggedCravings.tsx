import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Search, Filter, AlertTriangle, User, Calendar, MessageSquare, CheckCircle, XCircle, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export const FlaggedCravings = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [flagReasonFilter, setFlagReasonFilter] = useState<string>('all')
  const [selectedCravings, setSelectedCravings] = useState<string[]>([])

  // Note: This assumes cravings can be flagged
  // You may need to add a 'flagged' or 'flag_reason' field to the cravings collection
  const { data: cravingsData, isLoading } = useQuery({
    queryKey: ['cravings', 'flagged', flagReasonFilter],
    queryFn: async () => {
      try {
        // Try to filter flagged cravings
        // Adjust filter based on your schema
        return await adminCollectionHelpers.getFullList('cravings', {
          filter: buildFilter(),
          sort: '-created',
          expand: 'user',
        })
      } catch (error: any) {
        // If collection doesn't exist or filter fails, return empty
        return { data: [] }
      }
    },
  })

  const buildFilter = () => {
    // This is a placeholder - adjust based on your actual schema
    // You might have: flagged = true, or flag_reason != "", or intensity >= 4
    const filters: string[] = []
    
    // Example: Flag high intensity cravings (4-5) as potentially concerning
    filters.push('intensity >= 4')
    
    if (flagReasonFilter !== 'all') {
      // Add flag reason filter if you have that field
    }
    return filters.join(' && ')
  }

  const cravings = cravingsData?.data || []
  
  // Filter for high intensity or frequent cravings as "flagged"
  const flaggedCravings = cravings.filter((c: any) => {
    // Consider cravings with intensity 4-5 as flagged
    // Or you could check for a flagged field if it exists
    return c.intensity >= 4 || c.flagged === true
  })

  const markReviewedMutation = useMutation({
    mutationFn: async (id: string) => {
      // Update craving to mark as reviewed
      // You might need to add a 'reviewed' or 'flag_status' field
      return adminCollectionHelpers.update('cravings', id, {
        reviewed: true,
        reviewed_at: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cravings'] })
    },
  })

  const handleMarkReviewed = async (cravingId: string) => {
    try {
      await markReviewedMutation.mutateAsync(cravingId)
    } catch (error) {
      console.error('Failed to mark as reviewed:', error)
      alert('Failed to update craving status')
    }
  }

  const handleContactUser = (userId: string) => {
    // Navigate to create support ticket for this user
    navigate(`/support/tickets?user=${userId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold text-neutral-dark">Flagged Cravings</h1>
          <p className="text-neutral-500 mt-1">Review cravings that may need immediate attention</p>
        </div>
        {selectedCravings.length > 0 && (
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm">
              Mark as Reviewed ({selectedCravings.length})
            </button>
            <button className="btn-secondary text-sm">
              Send Bulk Message
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user name, notes..."
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
            <option value="high_intensity">High Intensity (4-5)</option>
            <option value="frequent">Frequent Cravings</option>
            <option value="keywords">Concerning Keywords</option>
            <option value="admin_flagged">Admin Flagged</option>
          </select>
        </div>
      </div>

      {/* Flagged Cravings List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : flaggedCravings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No flagged cravings found</p>
          <p className="text-sm text-neutral-400 mt-2">
            Cravings with intensity 4-5 or flagged by system/admin will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedCravings
            .filter((c: any) => {
              if (!searchQuery) return true
              const searchLower = searchQuery.toLowerCase()
              const user = c.expand?.user
              return (
                user?.name?.toLowerCase().includes(searchLower) ||
                user?.email?.toLowerCase().includes(searchLower) ||
                c.notes?.toLowerCase().includes(searchLower)
              )
            })
            .map((craving: any) => {
              const isUrgent = craving.intensity >= 5
              return (
                <div
                  key={craving.id}
                  className={`bg-white rounded-lg shadow-card p-6 border-l-4 ${
                    isUrgent ? 'border-danger' : 'border-warning'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                        {craving.expand?.user?.name?.[0]?.toUpperCase() || craving.expand?.user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-dark">
                          {craving.expand?.user?.name || craving.expand?.user?.email || 'Unknown User'}
                        </p>
                        <button
                          onClick={() => navigate(`/users/${craving.expand?.user?.id}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          View Profile →
                        </button>
                      </div>
                    </div>
                    {isUrgent && (
                      <span className="px-3 py-1 text-xs bg-danger/10 text-danger rounded font-medium">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-neutral-500">Type</label>
                      <p className={`font-medium ${
                        craving.type === 'slip' ? 'text-danger' : 'text-warning'
                      }`}>
                        {craving.type === 'slip' ? 'Slip' : 'Craving Resisted'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Intensity</label>
                      <p className="font-medium flex items-center gap-1">
                        {'⭐'.repeat(craving.intensity || 0)}
                        <span className="text-sm text-neutral-500">({craving.intensity}/5)</span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Trigger</label>
                      <p className="font-medium capitalize">{craving.trigger || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Date</label>
                      <p className="font-medium text-sm">
                        {craving.created ? formatDistanceToNow(new Date(craving.created), { addSuffix: true }) : '-'}
                      </p>
                    </div>
                  </div>

                  {craving.notes && (
                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                      <label className="text-xs text-neutral-500 mb-1 block">Notes</label>
                      <p className="text-sm text-neutral-700">{craving.notes}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="text-xs text-neutral-500 mb-1 block">Flag Reason</label>
                    <p className="text-sm text-neutral-700">
                      {craving.intensity >= 5
                        ? 'High intensity (5/5) - may need immediate support'
                        : 'High intensity (4/5) - monitor closely'}
                    </p>
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
                      onClick={() => handleContactUser(craving.expand?.user?.id)}
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Contact User
                    </button>
                    <button
                      onClick={() => handleMarkReviewed(craving.id)}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Reviewed
                    </button>
                    <button className="btn-secondary text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Dismiss Flag
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
