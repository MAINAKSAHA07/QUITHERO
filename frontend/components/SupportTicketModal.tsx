import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { supportService } from '../services/support.service'
import { SupportTicketCategory, SupportTicketPriority } from '../types/enums'
import { analyticsService } from '../services/analytics.service'

interface SupportTicketModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onCreated?: () => void
}

const fieldClass =
  'w-full bg-[#F4FBFF] border border-[#0E2538]/10 rounded-xl px-4 py-3 text-[#0E2538] placeholder:text-[#0E2538]/35 focus:border-[#3F8DD2] focus:ring-2 focus:ring-[#3F8DD2]/20 focus:outline-none disabled:opacity-50'

const categories = [
  { value: SupportTicketCategory.TECHNICAL, label: 'Technical' },
  { value: SupportTicketCategory.CONTENT, label: 'Program' },
  { value: SupportTicketCategory.BILLING, label: 'Billing' },
  { value: SupportTicketCategory.OTHER, label: 'Other' },
]

export default function SupportTicketModal({
  isOpen,
  onClose,
  userId,
  onCreated,
}: SupportTicketModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<SupportTicketCategory>(SupportTicketCategory.OTHER)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const reset = () => {
    setSubject('')
    setMessage('')
    setCategory(SupportTicketCategory.OTHER)
    setError('')
    setSuccess(false)
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      setError('Please enter a subject')
      return
    }
    if (!message.trim()) {
      setError('Please describe your issue')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await supportService.createTicket(userId, {
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority: SupportTicketPriority.MEDIUM,
      })

      if (result.success) {
        setSuccess(true)
        await analyticsService.trackEvent(
          'support_ticket_created',
          { category, priority: SupportTicketPriority.MEDIUM },
          userId
        )
        window.setTimeout(() => {
          reset()
          onClose()
          onCreated?.()
        }, 1600)
      } else {
        setError(result.error || 'Failed to create support ticket. Please try again.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-[#0E2538]/06"
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#0E2538]/06 px-5 pt-4 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0E2538]">Contact Support</h3>
                <p className="text-xs text-[#0E2538]/45 mt-0.5">We usually reply within a day</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="w-9 h-9 rounded-full bg-[#F4FBFF] flex items-center justify-center text-[#0E2538]/70 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {success ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-[#0E2538] mb-1">Ticket sent</h4>
                  <p className="text-sm text-[#0E2538]/55">
                    Thanks. You can follow replies under My Support Tickets.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0E2538]/80 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={loading}
                      placeholder="Brief description of your issue"
                      className={fieldClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0E2538]/80 mb-1.5">
                      Topic
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => {
                        const on = category === cat.value
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            disabled={loading}
                            onClick={() => setCategory(cat.value)}
                            className={`rounded-xl px-3 py-2.5 text-sm font-semibold border transition-colors ${
                              on
                                ? 'bg-[#3F8DD2]/10 border-[#3F8DD2]/40 text-[#2A6BA8]'
                                : 'bg-[#F4FBFF] border-[#0E2538]/08 text-[#0E2538]/70'
                            }`}
                          >
                            {cat.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0E2538]/80 mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={loading}
                      placeholder="Tell us what happened. Include the screen or day if you can."
                      rows={5}
                      className={`${fieldClass} resize-none`}
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] text-[#0E2538] font-semibold text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !subject.trim() || !message.trim()}
                      className="flex-1 py-3 rounded-xl bg-[#3F8DD2] text-white font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        'Sending…'
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
