import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Search, Filter, AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, User, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Note: This assumes support_tickets collection exists
// If not, this will need to be created in PocketBase

export const SupportTickets = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support_tickets', statusFilter, priorityFilter, categoryFilter, searchQuery],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('support_tickets', {
          filter: buildFilter(),
          sort: '-created',
          expand: 'user',
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

  const buildFilter = () => {
    const filters: string[] = []
    if (searchQuery) {
      filters.push(`subject ~ "${searchQuery}" || message ~ "${searchQuery}"`)
    }
    if (statusFilter !== 'all') {
      filters.push(`status = "${statusFilter}"`)
    }
    if (priorityFilter !== 'all') {
      filters.push(`priority = "${priorityFilter}"`)
    }
    if (categoryFilter !== 'all') {
      filters.push(`category = "${categoryFilter}"`)
    }
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const tickets = ticketsData?.data || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-danger text-white'
      case 'high':
        return 'bg-primary text-white'
      case 'medium':
        return 'bg-warning text-neutral-dark'
      case 'low':
        return 'bg-success text-white'
      default:
        return 'bg-neutral-200 text-neutral-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-danger" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-success" />
      case 'closed':
        return <XCircle className="w-4 h-4 text-neutral-400" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const statusCounts = {
    open: tickets.filter((t: any) => t.status === 'open').length,
    in_progress: tickets.filter((t: any) => t.status === 'in_progress').length,
    resolved: tickets.filter((t: any) => t.status === 'resolved').length,
    closed: tickets.filter((t: any) => t.status === 'closed').length,
  }

  const priorityCounts = {
    urgent: tickets.filter((t: any) => t.priority === 'urgent').length,
    high: tickets.filter((t: any) => t.priority === 'high').length,
    medium: tickets.filter((t: any) => t.priority === 'medium').length,
    low: tickets.filter((t: any) => t.priority === 'low').length,
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar Filters */}
      <div className="w-64 flex-shrink-0 space-y-6">
        <div className="bg-white rounded-lg shadow-card p-4">
          <h3 className="font-semibold mb-4">Status</h3>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All', count: tickets.length },
              { value: 'open', label: 'Open', count: statusCounts.open },
              { value: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
              { value: 'resolved', label: 'Resolved', count: statusCounts.resolved },
              { value: 'closed', label: 'Closed', count: statusCounts.closed },
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
                <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">
                  {status.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <h3 className="font-semibold mb-4">Priority</h3>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All', count: tickets.length },
              { value: 'urgent', label: 'Urgent', count: priorityCounts.urgent },
              { value: 'high', label: 'High', count: priorityCounts.high },
              { value: 'medium', label: 'Medium', count: priorityCounts.medium },
              { value: 'low', label: 'Low', count: priorityCounts.low },
            ].map((priority) => (
              <button
                key={priority.value}
                onClick={() => setPriorityFilter(priority.value)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                  priorityFilter === priority.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-neutral-50'
                }`}
              >
                <span>{priority.label}</span>
                <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">
                  {priority.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <h3 className="font-semibold mb-4">Category</h3>
          <div className="space-y-2">
            {['all', 'technical', 'content', 'billing', 'other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`w-full p-2 rounded-lg text-left transition-colors capitalize ${
                  categoryFilter === cat
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-neutral-50'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-neutral-dark">Support Tickets</h1>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>

        {/* Search and Sort */}
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Sort by Date</option>
              <option>Sort by Priority</option>
              <option>Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 mb-2">No support tickets found</p>
            <p className="text-sm text-neutral-400">
              {ticketsData === undefined
                ? 'Support tickets collection may need to be created in PocketBase'
                : 'Create a ticket to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getPriorityColor(ticket.priority || 'medium')}`}>
                    {getStatusIcon(ticket.status || 'open')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-dark mb-1">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-neutral-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {ticket.expand?.user?.name || ticket.expand?.user?.email || 'Unknown User'}
                          </div>
                          {ticket.category && (
                            <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs capitalize">
                              {ticket.category}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {ticket.created ? formatDistanceToNow(new Date(ticket.created), { addSuffix: true }) : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(ticket.priority || 'medium')}`}>
                          {ticket.priority || 'medium'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          ticket.status === 'open' ? 'bg-danger/10 text-danger' :
                          ticket.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                          ticket.status === 'resolved' ? 'bg-success/10 text-success' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {ticket.status || 'open'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {ticket.message}
                    </p>
                    {ticket.assigned_to && (
                      <div className="mt-3 text-xs text-neutral-500">
                        Assigned to: {ticket.assigned_to}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
