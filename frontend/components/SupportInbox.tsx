import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, Send, X } from 'lucide-react'
import GlassCard from './GlassCard'
import GlassButton from './GlassButton'
import { supportService } from '../services/support.service'
import { SupportTicket, SupportTicketMessage } from '../types/models'

function safeRelative(value?: string): string {
  if (!value?.trim()) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

interface SupportInboxProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onNewTicket: () => void
}

export default function SupportInbox({ isOpen, onClose, userId, onNewTicket }: SupportInboxProps) {
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

  const loadMessages = async (ticket: SupportTicket) => {
    if (!ticket.id) return
    const result = await supportService.getMessages(ticket.id)
    if (result.success && result.data) {
      setMessages(result.data)
    } else {
      setError(result.error || 'Could not load chat')
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setActive(null)
    setMessages([])
    setDraft('')
    loadTickets()
  }, [isOpen, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, active])

  const openTicket = async (ticket: SupportTicket) => {
    setActive(ticket)
    setDraft('')
    setError('')
    await loadMessages(ticket)
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

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-[85vh] sm:h-[70vh]"
      >
        <GlassCard variant="strong" className="h-full flex flex-col p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              {active ? (
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-text-primary" />
                </button>
              ) : null}
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-text-primary truncate">
                  {active ? active.subject : 'My Support Tickets'}
                </h3>
                {active ? (
                  <p className="text-xs text-text-primary/50 capitalize">{active.status?.replace('_', ' ')}</p>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>

          {!active ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <p className="text-sm text-text-primary/60 text-center py-8">Loading…</p>
              ) : tickets.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <MessageCircle className="w-10 h-10 mx-auto text-text-primary/30" />
                  <p className="text-sm text-text-primary/70">No tickets yet</p>
                  <GlassButton variant="primary" onClick={onNewTicket}>
                    Contact Support
                  </GlassButton>
                </div>
              ) : (
                <>
                  {tickets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openTicket(t)}
                      className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10"
                    >
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="font-semibold text-text-primary text-sm truncate">{t.subject}</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-primary/50 shrink-0">
                          {t.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-text-primary/60 line-clamp-2">
                        Open conversation
                      </p>
                      {t.created ? (
                        <p className="text-[10px] text-text-primary/40 mt-1">{safeRelative(t.created)}</p>
                      ) : null}
                    </button>
                  ))}
                  <GlassButton variant="secondary" onClick={onNewTicket} className="w-full mt-2">
                    New ticket
                  </GlassButton>
                </>
              )}
              {error ? <p className="text-sm text-error text-center">{error}</p> : null}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const mine = m.sender_role === 'user'
                  return (
                    <div key={m.id || m.created} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'bg-[#3F8DD2] text-white rounded-br-md'
                            : 'bg-white/10 text-text-primary rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        {m.created ? (
                          <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-text-primary/40'}`}>
                            {safeRelative(m.created)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              {active.status !== 'closed' ? (
                <div className="p-3 border-t border-white/10 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    placeholder="Write a reply…"
                    disabled={sending}
                    className="glass-input flex-1"
                  />
                  <GlassButton
                    variant="primary"
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    className="!px-3"
                  >
                    <Send className="w-4 h-4" />
                  </GlassButton>
                </div>
              ) : (
                <p className="text-center text-xs text-text-primary/50 py-3">This ticket is closed</p>
              )}
              {error ? <p className="text-sm text-error text-center px-3 pb-2">{error}</p> : null}
            </>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
