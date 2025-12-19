import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Send, AlertCircle } from 'lucide-react'
import GlassCard from './GlassCard'
import GlassButton from './GlassButton'
import GlassInput from './GlassInput'
import { supportService } from '../services/support.service'
import { SupportTicketCategory, SupportTicketPriority } from '../types/enums'
import { analyticsService } from '../services/analytics.service'

interface SupportTicketModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function SupportTicketModal({ isOpen, onClose, userId }: SupportTicketModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<SupportTicketCategory>(SupportTicketCategory.OTHER)
  const [priority, setPriority] = useState<SupportTicketPriority>(SupportTicketPriority.MEDIUM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const categories = [
    { value: SupportTicketCategory.TECHNICAL, label: 'Technical Issue' },
    { value: SupportTicketCategory.CONTENT, label: 'Content Question' },
    { value: SupportTicketCategory.BILLING, label: 'Billing' },
    { value: SupportTicketCategory.OTHER, label: 'Other' },
  ]

  const priorities = [
    { value: SupportTicketPriority.LOW, label: 'Low' },
    { value: SupportTicketPriority.MEDIUM, label: 'Medium' },
    { value: SupportTicketPriority.HIGH, label: 'High' },
    { value: SupportTicketPriority.URGENT, label: 'Urgent' },
  ]

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
        priority,
      })

      if (result.success) {
        setSuccess(true)
        // Track analytics
        await analyticsService.trackEvent('support_ticket_created', {
          category,
          priority,
        }, userId)

        // Reset form after 2 seconds and close
        setTimeout(() => {
          setSubject('')
          setMessage('')
          setCategory(SupportTicketCategory.OTHER)
          setPriority(SupportTicketPriority.MEDIUM)
          setSuccess(false)
          onClose()
        }, 2000)
      } else {
        setError(result.error || 'Failed to create support ticket. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSubject('')
      setMessage('')
      setCategory(SupportTicketCategory.OTHER)
      setPriority(SupportTicketPriority.MEDIUM)
      setError('')
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <GlassCard variant="strong" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-text-primary">Contact Support</h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-success" />
              </div>
              <h4 className="text-lg font-semibold text-text-primary mb-2">Ticket Created!</h4>
              <p className="text-text-primary/70">
                Your support ticket has been submitted. We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput
                label="Subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                required
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                  disabled={loading}
                  className="glass-input w-full"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SupportTicketPriority)}
                  disabled={loading}
                  className="glass-input w-full"
                >
                  {priorities.map((pri) => (
                    <option key={pri.value} value={pri.value}>
                      {pri.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  placeholder="Please describe your issue in detail..."
                  rows={6}
                  className="glass-input w-full resize-none"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={loading || !subject.trim() || !message.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 inline mr-2" />
                      Submit Ticket
                    </>
                  )}
                </GlassButton>
              </div>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
