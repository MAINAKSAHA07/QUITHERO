import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Wind, MessageCircle, Phone, Clipboard, Smile, Frown, History, Cigarette } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import MotivationalQuoteModal from '../components/MotivationalQuoteModal'
import CravingHistoryModal from '../components/CravingHistoryModal'
import SlipRecovery from '../components/SlipRecovery'
import { useApp } from '../context/AppContext'
import { useCravings } from '../hooks/useCravings'
import { analyticsService } from '../services/analytics.service'
import { achievementService } from '../services/achievement.service'
import { behaviorProfileService } from '../services/behavior-profile.service'
import { contentService } from '../services/content.service'
import { CravingType, CravingTrigger, ResolutionMethod } from '../types/enums'

// Fallback motivational quotes
const fallbackQuotes = [
  {
    text: "You didn't come this far to only come this far.",
    details: "Every moment you resist is a victory. Keep going!",
  },
  {
    text: "This feeling will pass.",
    details: "Cravings are temporary. You are stronger than this moment.",
  },
  {
    text: "Progress, not perfection.",
    details: "Every craving you resist is progress. You're doing great!",
  },
  {
    text: "You've got this!",
    details: "Remember why you started. Your future self will thank you.",
  },
]

const TRIGGER_THOUGHT_PROMPTS: Partial<Record<CravingTrigger, string>> = {
  [CravingTrigger.STRESS]: 'What stressful thought just crossed your mind?',
  [CravingTrigger.BOREDOM]: 'What were you telling yourself about needing stimulation?',
  [CravingTrigger.SOCIAL]: 'What thought made smoking seem necessary in this social moment?',
  [CravingTrigger.HABIT]: 'What automatic thought triggered this routine craving?',
  [CravingTrigger.OTHER]: 'What thought came just before the craving?',
}

const RESOLUTION_OPTIONS: { value: ResolutionMethod; label: string }[] = [
  { value: ResolutionMethod.BREATHING, label: '🌬️ Did breathing exercise' },
  { value: ResolutionMethod.DISTRACTION, label: '🎯 Distracted myself' },
  { value: ResolutionMethod.PASSED_ON_OWN, label: '⏳ It passed on its own' },
  { value: ResolutionMethod.MOTIVATIONAL, label: '💪 Read a motivational message' },
  { value: ResolutionMethod.JOURNALED, label: '📝 Journaled about it' },
  { value: ResolutionMethod.SMOKED, label: '🚬 I smoked' },
]

export default function CravingSupport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, refreshProgress } = useApp()
  const { cravings, logCraving, fetchCravings } = useCravings()
  const [showLogForm, setShowLogForm] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<{ text: string; details?: string } | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [showResolutionPicker, setShowResolutionPicker] = useState(false)
  const [encouragementMessage, setEncouragementMessage] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [trigger, setTrigger] = useState<CravingTrigger | ''>('')
  const [customTrigger, setCustomTrigger] = useState('')
  const [automaticThought, setAutomaticThought] = useState('')
  const [notes, setNotes] = useState('')
  const [slipped, setSlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastCravingId, setLastCravingId] = useState<string | null>(null)

  const triggers = [
    { value: CravingTrigger.STRESS, label: 'Stress' },
    { value: CravingTrigger.BOREDOM, label: 'Boredom' },
    { value: CravingTrigger.SOCIAL, label: 'Social situation' },
    { value: CravingTrigger.HABIT, label: 'Habit/routine' },
    { value: CravingTrigger.OTHER, label: 'Other' },
  ]

  useEffect(() => {
    if (user?.id) {
      fetchCravings({ limit: 50 })
    }
  }, [user?.id])

  // Check if user came from home page to log a slip directly
  useEffect(() => {
    const isSlip = searchParams.get('slip') === 'true'
    if (isSlip) {
      setSlipped(true)
      setShowLogForm(true)
      // Clear the query parameter
      navigate('/craving', { replace: true })
    }
  }, [searchParams, navigate])

  const getRandomQuote = async () => {
    try {
      const result = await contentService.getRandomQuote()
      if (result.success && result.data) {
        return {
          text: result.data.title || result.data.content,
          details: result.data.content || '',
        }
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
    // Fallback to default quotes
    const randomIndex = Math.floor(Math.random() * fallbackQuotes.length)
    return fallbackQuotes[randomIndex]
  }

  const showMotivationalMessage = async () => {
    const quote = await getRandomQuote()
    setCurrentQuote(quote)
    setShowQuoteModal(true)
    analyticsService.trackEvent('motivational_message_viewed', {}, user?.id)
  }


  const handleCallSupportBuddy = () => {
    // TODO: Implement support buddy feature
    alert('Support buddy feature coming soon!')
    analyticsService.trackEvent('support_buddy_clicked', {}, user?.id)
  }

  const handleLogCraving = () => {
    setShowLogForm(true)
  }

  const handleSave = async () => {
    if (!user?.id) {
      setError('User not found. Please login again.')
      return
    }

    if (!trigger) {
      setError('Please select a trigger')
      return
    }

    if (trigger === CravingTrigger.OTHER && !customTrigger.trim()) {
      setError('Please specify the custom trigger')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await logCraving({
        type: slipped ? CravingType.SLIP : CravingType.CRAVING,
        intensity,
        trigger: trigger as CravingTrigger,
        trigger_custom: trigger === CravingTrigger.OTHER ? customTrigger : undefined,
        notes: notes.trim() || undefined,
        automatic_thought: automaticThought.trim() || undefined,
      })

      if (result.success) {
        if (result.data?.id) setLastCravingId(result.data.id)

        // Track analytics
        await analyticsService.trackCravingLogged(
          user.id,
          slipped ? 'slip' : 'craving',
          trigger
        )

        // Recalculate progress
        await refreshProgress()

        // Check for achievements
        await achievementService.checkAndUnlock(user.id)

        // Recompute behavioral profile — non-blocking
        behaviorProfileService.computeAndSave(user.id).catch(() => {})

        // Show encouragement message
        const cravingsThisWeek = cravings.filter((c) => {
          const cravingDate = new Date(c.created || '')
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return cravingDate >= weekAgo && c.type === CravingType.CRAVING
        }).length

        if (slipped) {
          setEncouragementMessage(
            `It's okay. Tomorrow is a new day. You've come this far - keep going! 💪`
          )
        } else {
          setEncouragementMessage(
            `Great job! You've resisted ${cravingsThisWeek + 1} craving${cravingsThisWeek > 0 ? 's' : ''} this week! 🎉`
          )
        }

        setShowEncouragement(true)

        // Reset form
        setIntensity(3)
        setTrigger('')
        setCustomTrigger('')
        setAutomaticThought('')
        setNotes('')
        setSlipped(false)
        setShowLogForm(false)

        // Show resolution picker after short encouragement
        setTimeout(() => {
          setShowEncouragement(false)
          setShowResolutionPicker(true)
        }, 2000)
      } else {
        setError(result.error || 'Failed to save craving. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      icon: Wind,
      title: 'Start 5-Minute Breathing',
      gradient: 'from-info to-info/80',
      onClick: () => {
        analyticsService.trackEvent('quick_action_clicked', { action: 'breathing' }, user?.id)
        navigate('/breathing')
      },
    },
    {
      icon: MessageCircle,
      title: 'Read Motivational Message',
      gradient: 'from-brand-primary to-brand-accent',
      onClick: showMotivationalMessage,
    },
    {
      icon: Phone,
      title: 'Call Support Buddy',
      gradient: 'from-success to-success/80',
      onClick: handleCallSupportBuddy,
    },
    {
      icon: Clipboard,
      title: 'Log This Craving',
      gradient: 'from-info/80 to-brand-primary',
      onClick: handleLogCraving,
    },
    {
      icon: Cigarette,
      title: 'I Smoked (Log a Slip)',
      gradient: 'from-error to-error/80',
      onClick: () => {
        setSlipped(true)
        handleLogCraving()
        analyticsService.trackEvent('quick_action_clicked', { action: 'log_slip' }, user?.id)
      },
    },
  ]

  if (showLogForm) {
    return (
      <div className="min-h-screen pb-20">
        <TopNavigation 
          left="back" 
          center={slipped ? "Log a Slip" : "Log Craving"} 
          right=""
        />

        <div className="app-container px-3 sm:px-4 pt-6 pb-8">
          <GlassCard className="p-6 mb-6">
            {slipped && (
              <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl">
                <p className="text-error font-medium text-center">
                  It's okay. Tomorrow is a new day. 💪
                </p>
                <p className="text-text-primary/70 text-sm text-center mt-2">
                  Logging this slip helps track your progress and learn from it.
                </p>
              </div>
            )}
            <h2 className="text-xl font-bold text-text-primary mb-6">
              {slipped ? 'Tell us what happened' : 'How intense is this craving?'}
            </h2>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`w-12 h-12 rounded-full glass flex items-center justify-center transition-all ${
                      intensity === level
                        ? 'ring-2 ring-brand-primary shadow-glow scale-110'
                        : ''
                    }`}
                  >
                    {level <= 2 ? (
                      <Smile className="w-6 h-6" />
                    ) : level === 3 ? (
                      <span className="text-lg">😐</span>
                    ) : (
                      <Frown className="w-6 h-6" />
                    )}
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-text-primary/70">
                {intensity <= 2 && 'Mild'}
                {intensity === 3 && 'Moderate'}
                {intensity >= 4 && 'Strong'}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-3">
                What triggered it?
              </label>
              <div className="flex flex-wrap gap-2">
                {triggers.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTrigger(t.value)}
                    className={`px-4 py-2 rounded-full glass text-sm transition-all ${
                      trigger === t.value
                        ? 'ring-2 ring-brand-primary shadow-glow bg-brand-primary/20'
                        : ''
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {trigger === CravingTrigger.OTHER && (
                <input
                  type="text"
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder="Specify the trigger"
                  className="glass-input w-full mt-3"
                />
              )}
            </div>

            {trigger && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {TRIGGER_THOUGHT_PROMPTS[trigger as CravingTrigger] || 'What thought came just before?'}
                </label>
                <textarea
                  value={automaticThought}
                  onChange={(e) => setAutomaticThought(e.target.value)}
                  placeholder="e.g. 'I deserve a break' or 'Just one won't hurt'"
                  className="glass-input w-full min-h-[80px] resize-none"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Any notes? (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling?"
                className="glass-input w-full min-h-[100px] resize-none"
              />
            </div>

            {!slipped && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Did you slip?
                  </label>
                  <button
                    onClick={() => setSlipped(!slipped)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      slipped ? 'bg-error' : 'bg-text-primary/30'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        slipped ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
                {slipped && (
                  <p className="mt-2 text-sm text-text-primary/70">
                    It's okay. Tomorrow is a new day. 💪
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-error mb-4 text-center">{error}</p>
            )}

            <GlassButton
              onClick={handleSave}
              fullWidth
              className="py-4"
              disabled={loading || !trigger || (trigger === CravingTrigger.OTHER && !customTrigger.trim())}
            >
              {loading ? 'Saving...' : 'Save'}
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    )
  }

  // Resolution picker — shown after encouragement
  if (showResolutionPicker) {
    const handleResolution = async (method: ResolutionMethod | null) => {
      if (method && lastCravingId && user?.id) {
        try {
          const { pb } = await import('../lib/pocketbase')
          await pb.collection('cravings').update(lastCravingId, { resolution_method: method })
        } catch { /* non-critical */ }
      }
      setShowResolutionPicker(false)
      navigate('/home')
    }

    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-container px-3 sm:px-4"
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-text-primary mb-2 text-center">
              How did you get through it?
            </h2>
            <p className="text-sm text-text-primary/60 text-center mb-5">
              This helps us personalize your support
            </p>
            <div className="flex flex-col gap-2">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleResolution(opt.value)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-white/20 glass hover:bg-white/10 transition-colors text-sm"
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => handleResolution(null)}
                className="w-full text-center px-4 py-2 text-sm text-text-primary/50 mt-2"
              >
                Skip
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  // Slip recovery — compassionate full-screen experience
  if (showEncouragement && slipped) {
    return <SlipRecovery daysFree={0} onDismiss={() => navigate('/home')} />
  }

  // Craving resisted — celebratory overlay
  if (showEncouragement) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="app-container px-3 sm:px-4"
        >
          <GlassCard className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Great Job!
            </h2>
            <p className="text-text-primary/80 text-lg mb-6">
              {encouragementMessage}
            </p>
            <GlassButton onClick={() => navigate('/home')} fullWidth className="py-4">
              Back to Home
            </GlassButton>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <TopNavigation
        left="back"
        center="We're Here to Help"
        right={
          <button onClick={() => navigate('/home')}>
            <X className="w-6 h-6 text-text-primary" />
          </button>
        }
      />

      <div className="app-container px-3 sm:px-4 pt-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full glass-strong flex items-center justify-center">
            <span className="text-4xl">🌊</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            We're Here to Help
          </h1>
          <p className="text-text-primary/70">
            This feeling will pass. Let's get through it together.
          </p>
        </motion.div>

        <div className="space-y-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassButton
                  onClick={action.onClick}
                  fullWidth
                  className={`py-6 bg-gradient-to-r ${action.gradient} text-left`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-semibold text-white">{action.title}</span>
                  </div>
                </GlassButton>
              </motion.div>
            )
          })}
        </div>

        {/* View History Button */}
        {cravings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <GlassButton
              onClick={() => setShowHistoryModal(true)}
              variant="secondary"
              fullWidth
              className="py-4"
            >
              <span className="flex items-center justify-center gap-2">
                <History className="w-5 h-5" /> View Craving History
              </span>
            </GlassButton>
          </motion.div>
        )}
      </div>

      {/* Motivational Quote Modal */}
      {currentQuote && (
        <MotivationalQuoteModal
          isOpen={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false)
            setCurrentQuote(null)
          }}
          quote={currentQuote}
        />
      )}

      {/* Craving History Modal */}
      <CravingHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        cravings={cravings}
      />
    </div>
  )
}

