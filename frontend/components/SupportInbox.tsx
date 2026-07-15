import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, Send, X } from 'lucide-react'
import { supportService } from '../services/support.service'
import { SupportTicket, SupportTicketMessage } from '../types/models'
import { SupportTicketStatus } from '../types/enums'

function safeRelative(value?: string): string {
  if (!value?.trim()) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusStyle(status?: string): string {
  switch (status) {
    case SupportTicketStatus.OPEN:
      return 'bg-[#3F8DD2]/12 text-[#2A6BA8]'
    case SupportTicketStatus.IN_PROGRESS:
      return 'bg-amber-100 text-amber-700'
    case SupportTicketStatus.RESOLVED:
      return 'bg-emerald-100 text-emerald-700'
    case SupportTicketStatus.CLOSED:
      return 'bg-[#0E2538]/08 text-[#0E2538]/55'
    default:
      return 'bg-[#0E2538]/08 text-[#0E2538]/55'
  }
}

function statusLabel(status?: string): string {
  return (status || 'open').replace(/_/g, ' ')
}

interface SupportInboxProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onNewTicket: () => void
}

export default function SupportInbox({
  isOpen,
  onClose,
  userId,
  onNewTicket,
}: SupportInboxProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportTicketMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    const result = await supportService.getByUser(userId)
    if (result.success && result.data) {
      setTickets(result.data)
    } else {
      setError(result.error || 'Could not load tickets')
    }
    setLoading(false)
  }

  const loadMessages = async (ticketId: string, opts?: { quiet?: boolean }) => {
    const result = await supportService.getMessages(ticketId)
    if (result.success && result.data) {
      setMessages(result.data)
    } else if (!opts?.quiet) {
      setError(result.error || 'Could not load chat')
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setActive(null)
    setMessages([])
    setDraft('')
    void loadTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId])

  // ponytail: messages collection is API-only (encrypted); poll while chat is open.
  useEffect(() => {
    if (!isOpen || !active?.id) return
    const ticketId = active.id
    const refresh = () => {
      if (document.visibilityState === 'hidden') return
      void loadMessages(ticketId, { quiet: true })
    }
    const id = window.setInterval(refresh, 2500)
    return () => window.clearInterval(id)
  }, [isOpen, active?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, messages[messages.length - 1]?.id, active?.id])

  const openTicket = async (ticket: SupportTicket) => {
    if (!ticket.id) return
    setActive(ticket)
    setDraft('')
    setError('')
    await loadMessages(ticket.id)
  }

  const send = async () => {
    if (!active?.id || !draft.trim() || sending) return
    setSending(true)
    setError('')
    const result = await supportService.sendMessage(active.id, draft.trim(), 'user')
    if (result.success && result.data) {
      setMessages((prev) => [...prev, result.data!])
      setDraft('')
    } else {
      setError(result.error || 'Failed to send')
    }
    setSending(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-[88dvh] sm:h-[72vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-[#0E2538]/06 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#0E2538]/06 bg-white">
              <div className="flex items-center gap-1.5 min-w-0">
                {active ? (
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="w-9 h-9 rounded-full bg-[#F4FBFF] flex items-center justify-center flex-shrink-0"
                    aria-label="Back to tickets"
                  >
                    <ArrowLeft className="w-5 h-5 text-[#0E2538]/70" />
                  </button>
                ) : null}
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#0E2538] truncate">
                    {active ? active.subject : 'My Support Tickets'}
                  </h3>
                  {active ? (
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle(active.status)}`}
                    >
                      {statusLabel(active.status)}
                    </span>
                  ) : (
                    <p className="text-xs text-[#0E2538]/45 mt-0.5">
                      {tickets.length
                        ? `${tickets.length} conversation${tickets.length === 1 ? '' : 's'}`
                        : 'Ask anything about your quit journey'}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#F4FBFF] flex items-center justify-center flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#0E2538]/70" />
              </button>
            </div>

            {!active ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {loading ? (
                  <div className="space-y-2.5 py-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-[4.5rem] rounded-2xl bg-[#F4FBFF] border border-[#0E2538]/06 animate-pulse"
                      />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-[#E8F4FC] text-[#3F8DD2] flex items-center justify-center mx-auto">
                      <MessageCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0E2538]">No tickets yet</p>
                      <p className="text-xs text-[#0E2538]/45 mt-1 leading-relaxed">
                        Need help with a session, billing, or a bug? Send a note and we’ll reply here.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onNewTicket}
                      className="w-full mt-2 py-3.5 rounded-xl bg-[#3F8DD2] text-white font-semibold text-sm"
                    >
                      Contact Support
                    </button>
                  </div>
                ) : (
                  <>
                    {tickets.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => void openTicket(t)}
                        className="w-full text-left rounded-2xl border border-[#0E2538]/08 bg-[#F4FBFF] hover:bg-[#E8F4FC] p-3.5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm text-[#0E2538] line-clamp-1">
                            {t.subject}
                          </span>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle(t.status)}`}
                          >
                            {statusLabel(t.status)}
                          </span>
                        </div>
                        <p className="text-xs text-[#0E2538]/50">Tap to open conversation</p>
                        {t.created ? (
                          <p className="text-[10px] text-[#0E2538]/35 mt-1.5">
                            {safeRelative(t.created)}
                          </p>
                        ) : null}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={onNewTicket}
                      className="w-full mt-1 py-3 rounded-xl border border-[#0E2538]/10 bg-white text-[#0E2538] font-semibold text-sm"
                    >
                      New ticket
                    </button>
                  </>
                )}
                {error ? <p className="text-sm text-red-500 text-center pt-2">{error}</p> : null}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F8FBFD]">
                  {messages.length === 0 ? (
                    <p className="text-center text-xs text-[#0E2538]/40 py-8">
                      No messages in this thread yet
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_role === 'user'
                      return (
                        <div
                          key={m.id || `${m.created}-${m.body?.slice(0, 12)}`}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                              mine
                                ? 'bg-[#3F8DD2] text-white rounded-br-md'
                                : 'bg-white text-[#0E2538] border border-[#0E2538]/08 rounded-bl-md shadow-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            {m.created ? (
                              <p
                                className={`text-[10px] mt-1 ${
                                  mine ? 'text-white/70' : 'text-[#0E2538]/35'
                                }`}
                              >
                                {safeRelative(m.created)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {active.status !== SupportTicketStatus.CLOSED ? (
                  <div className="p-3 border-t border-[#0E2538]/06 bg-white flex gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void send()
                        }
                      }}
                      placeholder="Write a reply…"
                      disabled={sending}
                      className="flex-1 bg-[#F4FBFF] border border-[#0E2538]/10 rounded-xl px-4 py-3 text-sm text-[#0E2538] placeholder:text-[#0E2538]/35 focus:border-[#3F8DD2] focus:ring-2 focus:ring-[#3F8DD2]/20 focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => void send()}
                      disabled={sending || !draft.trim()}
                      className="w-11 h-11 rounded-xl bg-[#3F8DD2] text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                      aria-label="Send reply"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-[#0E2538]/45 py-3 border-t border-[#0E2538]/06">
                    This ticket is closed
                  </p>
                )}
                {error ? (
                  <p className="text-sm text-red-500 text-center px-3 pb-2">{error}</p>
                ) : null}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
