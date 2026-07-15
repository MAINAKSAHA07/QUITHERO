import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { fetchTicketMessages, replyTicketMessage } from '../../lib/supportChat'
import {
  Search,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  Send,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function safeRelativeTime(value?: string): string {
  if (!value?.trim()) return 'recently'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'recently'
  return formatDistanceToNow(d, { addSuffix: true })
}

type Ticket = {
  id: string
  user: string
  subject: string
  message?: string
  description?: string
  status: string
  priority?: string
  category?: string
  created?: string
  expand?: { user?: { name?: string; email?: string } }
}

type TicketMessage = {
  id: string
  ticket: string
  body: string
  sender_role: 'user' | 'admin'
  created?: string
}

export const SupportTickets = () => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const buildFilter = () => {
    const filters: string[] = []
    if (searchQuery) {
      filters.push(`subject ~ "${searchQuery}" || message ~ "${searchQuery}"`)
    }
    if (statusFilter !== 'all') filters.push(`status = "${statusFilter}"`)
    if (priorityFilter !== 'all') filters.push(`priority = "${priorityFilter}"`)
    if (categoryFilter !== 'all') filters.push(`category = "${categoryFilter}"`)
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support_tickets', statusFilter, priorityFilter, categoryFilter, searchQuery],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('support_tickets', {
          filter: buildFilter(),
          sort: recentSort('support_tickets'),
          expand: 'user',
        })
      } catch (error: any) {
        if (error?.status === 404 || error?.message?.includes('not found')) {
          return { data: [] }
        }
        throw error
      }
    },
  })

  const tickets = (ticketsData?.data || []) as unknown as Ticket[]

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['support_ticket_messages', selected?.id],
    enabled: !!selected?.id,
    // Messages are encrypted behind /api/support — no PB realtime. Poll while open.
    refetchInterval: selected?.id ? 2500 : false,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      if (!selected?.id) return { data: [] as TicketMessage[] }
      const result = await fetchTicketMessages(selected.id)
      if (!result.success) throw new Error(result.error)
      return { data: result.data }
    },
  })

  const messages = (messagesData?.data || []) as TicketMessage[]
  const displayMessages = messages

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages.length, selected?.id])

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const result = await adminCollectionHelpers.update('support_tickets', id, { status })
      if (!result.success) throw new Error(result.error || 'Failed to update status')
      return result
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['support_tickets'] })
      setSelected((prev) => (prev && prev.id === vars.id ? { ...prev, status: vars.status } : prev))
    },
  })

  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, body }: { ticketId: string; body: string }) => {
      const created = await replyTicketMessage(ticketId, body)
      if (!created.success) throw new Error(created.error || 'Failed to send reply')
      return created.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['support_ticket_messages', vars.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['support_tickets'] })
      setDraft('')
      setSelected((prev) =>
        prev && prev.id === vars.ticketId && prev.status === 'open'
          ? { ...prev, status: 'in_progress' }
          : prev
      )
    },
  })

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
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  }

  const priorityCounts = {
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    high: tickets.filter((t) => t.priority === 'high').length,
    medium: tickets.filter((t) => t.priority === 'medium').length,
    low: tickets.filter((t) => t.priority === 'low').length,
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-w-0">
      <div className="w-full xl:w-56 shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Status</h3>
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
                type="button"
                onClick={() => setStatusFilter(status.value)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                  statusFilter === status.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-neutral-50'
                }`}
              >
                <span>{status.label}</span>
                <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{status.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Priority</h3>
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
                type="button"
                onClick={() => setPriorityFilter(priority.value)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                  priorityFilter === priority.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-neutral-50'
                }`}
              >
                <span>{priority.label}</span>
                <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{priority.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Category</h3>
          <div className="space-y-2">
            {['all', 'technical', 'content', 'billing', 'other'].map((cat) => (
              <button
                key={cat}
                type="button"
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

      <div className="flex-1 space-y-4 min-w-0">
        <h1 className="text-2xl font-semibold text-neutral-dark tracking-tight">Support Tickets</h1>

        <div className="bg-white rounded-xl border border-neutral-200 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 mb-2">No support tickets found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => {
                  setSelected(ticket)
                  setDraft('')
                }}
                className={`w-full text-left bg-white rounded-lg shadow-card p-6 hover:shadow-card-lg transition-shadow ${
                  selected?.id === ticket.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getPriorityColor(ticket.priority || 'medium')}`}>
                    {getStatusIcon(ticket.status || 'open')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-neutral-dark mb-1 truncate">
                          {ticket.subject}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {ticket.expand?.user?.name || ticket.expand?.user?.email || 'Unknown User'}
                          </span>
                          {ticket.category ? (
                            <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs capitalize">
                              {ticket.category}
                            </span>
                          ) : null}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {safeRelativeTime(ticket.created)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-1 text-xs rounded ${getPriorityColor(ticket.priority || 'medium')}`}
                        >
                          {ticket.priority || 'medium'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            ticket.status === 'open'
                              ? 'bg-danger/10 text-danger'
                              : ticket.status === 'in_progress'
                                ? 'bg-warning/10 text-warning'
                                : ticket.status === 'resolved'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {ticket.status || 'open'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {ticket.message?.startsWith('sm1.')
                        ? 'Encrypted conversation'
                        : ticket.message || 'Open to view conversation'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="w-full xl:w-[400px] shrink-0 bg-white rounded-xl border border-neutral-200 flex flex-col max-h-[min(720px,calc(100vh-7rem))] xl:sticky xl:top-4">
          <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-neutral-dark truncate">{selected.subject}</h2>
              <p className="text-sm text-neutral-500 truncate">
                {selected.expand?.user?.email || selected.expand?.user?.name || selected.user}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="p-1.5 rounded hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-neutral-100">
            <label className="text-xs font-medium text-neutral-500 block mb-1">Status</label>
            <select
              value={selected.status || 'open'}
              onChange={(e) => statusMutation.mutate({ id: selected.id, status: e.target.value })}
              disabled={statusMutation.isPending}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px]">
            {messagesLoading ? (
              <p className="text-sm text-neutral-400 text-center py-8">Loading chat…</p>
            ) : (
              displayMessages.map((m) => {
                const mine = m.sender_role === 'admin'
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-neutral-100 text-neutral-800 rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-neutral-400'}`}>
                        {mine ? 'Support · ' : 'User · '}
                        {safeRelativeTime(m.created)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {selected.status !== 'closed' ? (
            <div className="p-3 border-t border-neutral-100 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (draft.trim()) {
                      replyMutation.mutate({ ticketId: selected.id, body: draft.trim() })
                    }
                  }
                }}
                placeholder="Reply to user…"
                disabled={replyMutation.isPending}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              />
              <button
                type="button"
                disabled={replyMutation.isPending || !draft.trim()}
                onClick={() => replyMutation.mutate({ ticketId: selected.id, body: draft.trim() })}
                className="btn-primary !px-3 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-neutral-400 py-3">Ticket closed</p>
          )}
          {replyMutation.isError ? (
            <p className="text-xs text-danger px-3 pb-2">
              {(replyMutation.error as Error)?.message || 'Failed to send reply'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
