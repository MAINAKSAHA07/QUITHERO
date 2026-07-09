import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, X, Calendar, Loader2 } from 'lucide-react'
import AppHeader, { appHeaderBtn } from '../components/AppHeader'
import BottomNavigation from '../components/BottomNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import { useApp } from '../context/AppContext'
import { useJournal } from '../hooks/useJournal'
import { analyticsService } from '../services/analytics.service'
import { JournalEntry } from '../types/models'
import { Mood } from '../types/enums'

const moodEmojis: Record<Mood, string> = {
  [Mood.VERY_HAPPY]: '😊',
  [Mood.HAPPY]: '🙂',
  [Mood.NEUTRAL]: '😐',
  [Mood.SAD]: '😔',
  [Mood.VERY_SAD]: '😢',
}

const moodOptions = [
  { value: Mood.VERY_HAPPY, emoji: '😊', label: 'Very Happy' },
  { value: Mood.HAPPY, emoji: '🙂', label: 'Happy' },
  { value: Mood.NEUTRAL, emoji: '😐', label: 'Neutral' },
  { value: Mood.SAD, emoji: '😔', label: 'Sad' },
  { value: Mood.VERY_SAD, emoji: '😢', label: 'Very Sad' },
]

export default function Journal() {
  const { user } = useApp()
  const location = useLocation()
  const { entries, loading, createEntry, updateEntry, deleteEntry, fetchEntries } = useJournal()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all')
  const [formData, setFormData] = useState({
    mood: Mood.HAPPY,
    title: '',
    content: '',
  })
  const [cbtMode, setCbtMode] = useState(false)
  const [cbtFields, setCbtFields] = useState({ antecedent: '', thought: '', response: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const state = location.state as { prompt?: string; openModal?: boolean } | null
    if (state?.openModal && state.prompt) {
      setFormData({
        mood: Mood.HAPPY,
        title: 'Session reflection',
        content: state.prompt,
      })
      setShowAddModal(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (user?.id) {
      let filter = ''
      if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const startDate = weekAgo.toISOString().split('T')[0]
        const endDate = new Date().toISOString().split('T')[0]
        filter = `date >= "${startDate}" && date <= "${endDate}"`
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const startDate = monthAgo.toISOString().split('T')[0]
        const endDate = new Date().toISOString().split('T')[0]
        filter = `date >= "${startDate}" && date <= "${endDate}"`
      }

      fetchEntries({ filter: filter || undefined, sort: '-date' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dateFilter])

  const handleSave = async () => {
    if (cbtMode) {
      if (!cbtFields.antecedent.trim() || !cbtFields.thought.trim()) {
        setError('Please fill in at least the Situation and Thought fields')
        return
      }
    } else if (!formData.content.trim() || formData.content.trim().length < 10) {
      setError('Please write at least 10 characters')
      return
    }

    if (!user?.id) {
      setError('User not found. Please login again.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingEntry && editingEntry.id) {
        // Update existing entry
        const result = await updateEntry(editingEntry.id, {
          mood: formData.mood,
          title: formData.title.trim() || undefined,
          content: formData.content.trim(),
        })

        if (result.success) {
          // Track analytics
          await analyticsService.trackEvent('journal_entry_updated', {}, user.id)
          setEditingEntry(null)
          setFormData({ mood: Mood.HAPPY, title: '', content: '' })
          setShowAddModal(false)
          // Refresh entries
          let filter = ''
          if (dateFilter === 'week') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            const startDate = weekAgo.toISOString().split('T')[0]
            const endDate = new Date().toISOString().split('T')[0]
            filter = `date >= "${startDate}" && date <= "${endDate}"`
          } else if (dateFilter === 'month') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            const startDate = monthAgo.toISOString().split('T')[0]
            const endDate = new Date().toISOString().split('T')[0]
            filter = `date >= "${startDate}" && date <= "${endDate}"`
          }
          await fetchEntries({ filter: filter || undefined, sort: '-date' })
        } else {
          setError(result.error || 'Failed to update entry')
        }
      } else {
        // Create new entry
        const entryContent = cbtMode
          ? `[Situation] ${cbtFields.antecedent}\n[Thought] ${cbtFields.thought}\n[Response] ${cbtFields.response}`
          : formData.content.trim()

        const result = await createEntry({
          date: new Date().toISOString().split('T')[0],
          mood: formData.mood,
          title: formData.title.trim() || undefined,
          content: entryContent,
          ...(cbtMode && {
            cbt_mode: true,
            antecedent: cbtFields.antecedent.trim(),
            automatic_thought: cbtFields.thought.trim(),
            behavioral_response: cbtFields.response.trim(),
          }),
        })

        if (result.success) {
          // Track analytics
          await analyticsService.trackJournalEntryCreated(user.id)
          setFormData({ mood: Mood.HAPPY, title: '', content: '' })
          setShowAddModal(false)
          // Refresh entries
          let filter = ''
          if (dateFilter === 'week') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            const startDate = weekAgo.toISOString().split('T')[0]
            const endDate = new Date().toISOString().split('T')[0]
            filter = `date >= "${startDate}" && date <= "${endDate}"`
          } else if (dateFilter === 'month') {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            const startDate = monthAgo.toISOString().split('T')[0]
            const endDate = new Date().toISOString().split('T')[0]
            filter = `date >= "${startDate}" && date <= "${endDate}"`
          }
          await fetchEntries({ filter: filter || undefined, sort: '-date' })
        } else {
          setError(result.error || 'Failed to create entry')
        }
      }
    } catch (err: any) {
      console.error('Error saving journal entry:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setFormData({
      mood: entry.mood,
      title: entry.title || '',
      content: entry.content,
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!user?.id) return

    setSaving(true)
    try {
      const result = await deleteEntry(id)
      if (result.success) {
        setShowDeleteConfirm(null)
        // Track analytics
        await analyticsService.trackEvent('journal_entry_deleted', {}, user.id)
      } else {
        setError(result.error || 'Failed to delete entry')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden relative bg-[#F4FBFF]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139, 205, 232, 0.35), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="flex-shrink-0 px-4 safe-area-top relative z-10">
        <AppHeader
          title="Journal"
          right={
            <button
              type="button"
              onClick={() => {
                setEditingEntry(null)
                setFormData({ mood: Mood.HAPPY, title: '', content: '' })
                setError('')
                setShowAddModal(true)
              }}
              className={appHeaderBtn}
              aria-label="Add journal entry"
            >
              <Plus className="w-5 h-5 text-[#3F8DD2]" />
            </button>
          }
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-1 scrollbar-thin pb-24 relative z-10">
        {/* Date Filter */}
        <div className="mb-6">
          <div className="flex gap-2">
            {(['all', 'week', 'month'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-full glass text-sm transition-all ${
                  dateFilter === filter
                    ? 'ring-2 ring-brand-primary shadow-glow bg-brand-primary/20'
                    : ''
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-brand-primary">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📔</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Start journaling your journey
            </h2>
            <p className="text-text-primary/70 mb-6">
              Write about your day, thoughts, challenges, or victories
            </p>
            <GlassButton
              onClick={() => {
                setEditingEntry(null)
                setFormData({ mood: Mood.HAPPY, title: '', content: '' })
                setError('')
                setShowAddModal(true)
              }}
              className="py-4"
            >
              Write Your First Entry
            </GlassButton>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard hover className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{moodEmojis[entry.mood] || '😐'}</span>
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">
                          {entry.title || 'Untitled Entry'}
                        </div>
                        <div className="text-xs text-text-primary/50 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="w-8 h-8 rounded-full glass-subtle flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-text-primary" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(entry.id || '')}
                        className="w-8 h-8 rounded-full glass-subtle flex items-center justify-center hover:bg-error/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                  <p className="text-text-primary/80 text-sm line-clamp-3">
                    {entry.content}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md mx-auto rounded-t-3xl p-6 bg-white shadow-2xl border-t border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How are you feeling?
                  </label>
                  <div className="flex gap-3">
                    {moodOptions.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setFormData({ ...formData, mood: mood.value })}
                        className={`text-4xl transition-all ${
                          formData.mood === mood.value
                            ? 'scale-125 drop-shadow-lg'
                            : 'opacity-50'
                        }`}
                        title={mood.label}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CBT Mode Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">CBT Mode</label>
                    <p className="text-xs text-gray-400">Structured thought analysis</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCbtMode(!cbtMode)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      cbtMode ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                      cbtMode ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Give your entry a title"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {cbtMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        A — Situation (What happened?)
                      </label>
                      <textarea
                        value={cbtFields.antecedent}
                        onChange={(e) => setCbtFields({ ...cbtFields, antecedent: e.target.value })}
                        placeholder="Describe the situation that triggered a craving or negative thought..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 min-h-[80px] resize-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        B — Automatic Thought
                      </label>
                      <textarea
                        value={cbtFields.thought}
                        onChange={(e) => setCbtFields({ ...cbtFields, thought: e.target.value })}
                        placeholder="What thought popped into your head? e.g. 'I need a cigarette to deal with this'"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 min-h-[80px] resize-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        C — Your Response
                      </label>
                      <textarea
                        value={cbtFields.response}
                        onChange={(e) => setCbtFields({ ...cbtFields, response: e.target.value })}
                        placeholder="How did you respond? What did you do instead?"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 min-h-[80px] resize-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Write about your day
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write about your day, thoughts, challenges, or victories..."
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 min-h-[200px] resize-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:outline-none text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-error text-center mb-2">{error}</p>
                )}

                <GlassButton
                  onClick={() => {
                    handleSave()
                  }}
                  fullWidth
                  className="py-4"
                  disabled={saving || (cbtMode ? (!cbtFields.antecedent.trim() || !cbtFields.thought.trim()) : (!formData.content.trim() || formData.content.trim().length < 10))}
                  type="button"
                >
                  {saving
                    ? 'Saving...'
                    : editingEntry
                    ? 'Update Entry'
                    : 'Save Entry'}
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <div className="p-6 bg-white rounded-2xl shadow-2xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Delete Entry?
                </h3>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this journal entry? This action cannot be undone.
                </p>
                {error && (
                  <p className="text-sm text-error mb-4 text-center">{error}</p>
                )}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={saving}
                    className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={saving}
                    className="flex-1 py-3 bg-error/10 border border-error/50 text-error rounded-xl font-medium hover:bg-error/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  )
}

