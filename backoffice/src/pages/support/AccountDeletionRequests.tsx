import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { AlertCircle, CheckCircle, Clock, Trash2, XCircle, User, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type DeletionRequest = {
  id: string
  user: string
  status: 'pending' | 'rejected' | 'completed'
  reason?: string
  admin_notes?: string
  processed_at?: string
  created?: string
  expand?: {
    user?: { id: string; email?: string; name?: string }
  }
}

function safeRelativeTime(value?: string): string {
  if (!value?.trim()) return 'recently'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'recently'
  return formatDistanceToNow(d, { addSuffix: true })
}

export const AccountDeletionRequests = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [notes, setNotes] = useState<Record<string, string>>({})

  const { data, isLoading, error } = useQuery({
    queryKey: ['account_deletion_requests', statusFilter],
    queryFn: async () => {
      const filter = statusFilter === 'all' ? undefined : `status = "${statusFilter}"`
      return adminCollectionHelpers.getFullList('account_deletion_requests', {
        filter,
        sort: recentSort('account_deletion_requests'),
        expand: 'user',
      })
    },
  })

  const requests = (data?.data || []) as unknown as DeletionRequest[]

  const processMutation = useMutation({
    mutationFn: async ({
      request,
      action,
    }: {
      request: DeletionRequest
      action: 'complete' | 'reject'
    }) => {
      const now = new Date().toISOString()
      const adminNotes = notes[request.id]?.trim() || ''

      if (action === 'complete') {
        await adminCollectionHelpers.delete('users', request.user)
        await adminCollectionHelpers.update('account_deletion_requests', request.id, {
          status: 'completed',
          processed_at: now,
          admin_notes: adminNotes,
        })
        return
      }

      await adminCollectionHelpers.update('account_deletion_requests', request.id, {
        status: 'rejected',
        processed_at: now,
        admin_notes: adminNotes,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_deletion_requests'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleAction = (request: DeletionRequest, action: 'complete' | 'reject') => {
    const userLabel = request.expand?.user?.email || request.user
    const message =
      action === 'complete'
        ? `Permanently delete ${userLabel} and all linked data? This cannot be undone.`
        : `Reject the deletion request for ${userLabel}?`

    if (!window.confirm(message)) return
    processMutation.mutate({ request, action })
  }

  const statusCounts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  }

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-card p-4">
          <h3 className="font-semibold mb-4">Status</h3>
          <div className="space-y-2">
            {[
              { value: 'pending', label: 'Pending', count: statusFilter === 'pending' ? statusCounts.pending : '—' },
              { value: 'rejected', label: 'Rejected', count: statusFilter === 'rejected' ? statusCounts.rejected : '—' },
              { value: 'completed', label: 'Completed', count: statusFilter === 'completed' ? statusCounts.completed : '—' },
              { value: 'all', label: 'All', count: requests.length },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                  statusFilter === status.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-neutral-50'
                }`}
              >
                <span>{status.label}</span>
                <span className="text-sm text-neutral-500">{status.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-dark">Account Deletion Requests</h1>
          <p className="text-neutral-600 mt-1">
            Review user requests and delete accounts from the backend when approved.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-danger/10 text-danger rounded-lg">
            Failed to load requests. Run <code className="text-sm">npm run pb:setup-account-deletion</code> on the server.
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-card p-8 text-center text-neutral-500">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-8 text-center text-neutral-500">
            No {statusFilter === 'all' ? '' : statusFilter} deletion requests.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {request.status === 'pending' && <Clock className="w-4 h-4 text-warning" />}
                      {request.status === 'completed' && <CheckCircle className="w-4 h-4 text-success" />}
                      {request.status === 'rejected' && <XCircle className="w-4 h-4 text-neutral-400" />}
                      <span className="font-semibold capitalize">{request.status}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>{request.expand?.user?.email || request.user}</span>
                      {request.expand?.user?.name && (
                        <span className="text-neutral-400">({request.expand.user.name})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                      <Calendar className="w-3 h-3" />
                      Requested {safeRelativeTime(request.created)}
                    </div>

                    {request.reason && (
                      <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 mb-3">
                        <span className="font-medium">User reason:</span> {request.reason}
                      </p>
                    )}

                    {request.admin_notes && (
                      <p className="text-sm text-neutral-600 mb-3">
                        <span className="font-medium">Admin notes:</span> {request.admin_notes}
                      </p>
                    )}

                    {request.status === 'pending' && (
                      <textarea
                        value={notes[request.id] || ''}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                        placeholder="Optional admin notes (visible in backoffice only)"
                        className="w-full mt-2 p-2 border border-neutral-200 rounded-lg text-sm"
                        rows={2}
                      />
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(request, 'complete')}
                        disabled={processMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete account
                      </button>
                      <button
                        onClick={() => handleAction(request, 'reject')}
                        disabled={processMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
