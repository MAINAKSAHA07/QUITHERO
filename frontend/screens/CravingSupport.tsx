import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wind,
  MessageCircle,
  Phone,
  Clipboard,
  Smile,
  Frown,
  History,
  Cigarette,
  ChevronRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react'
import AppHeader, { appHeaderBtn } from '../components/AppHeader'
import BottomNavigation from '../components/BottomNavigation'
import MotivationalQuoteModal from '../components/MotivationalQuoteModal'
import CravingHistoryModal from '../components/CravingHistoryModal'
import SlipRecovery from '../components/SlipRecovery'
import TranslatedText from '../components/TranslatedText'
import Mascot from '../components/Mascot'
import { useApp } from '../context/AppContext'
import { useCravings } from '../hooks/useCravings'
import { analyticsService } from '../services/analytics.service'
import { achievementService } from '../services/achievement.service'
import { behaviorProfileService } from '../services/behavior-profile.service'
import {
  aiNotificationScheduler,
  shouldTriggerCravingSpike,
} from '../services/ai-notification.service'
import { behaviorTracker } from '../services/behavior-tracker.service'
import { contentService } from '../services/content.service'
import { CravingType, CravingTrigger, ResolutionMethod } from '../types/enums'

const fallbackQuotes = [
  {
    text: "You didn't come this far to only come this far.",
    details: 'Every moment you resist is a victory. Keep going!',
  },
  {
    text: 'This feeling will pass.',
    details: 'Cravings are temporary. You are stronger than this moment.',
  },
  {
    text: 'Progress, not perfection.',
    details: "Every craving you resist is progress. You're doing great!",
  },
  {
    text: "You've got this!",
    details: 'Remember why you started. Your future self will thank you.',
  },
]

const TRIGGER_THOUGHT_PROMPTS: Partial<Record<CravingTrigger, string>> = {
  [CravingTrigger.STRESS]: 'What stressful thought just crossed your mind?',
  [CravingTrigger.BOREDOM]: 'What were you telling yourself about needing stimulation?',
  [CravingTrigger.SOCIAL]: 'What thought made smoking seem necessary in this social moment?',
  [CravingTrigger.HABIT]: 'What automatic thought triggered this routine craving?',
  [CravingTrigger.OTHER]: 'What thought came just before the craving?',
}

const RESOLUTION_OPTIONS: { value: ResolutionMethod; label: string; icon: typeof Wind }[] = [
  { value: ResolutionMethod.BREATHING, label: 'Did breathing exercise', icon: Wind },
  { value: ResolutionMethod.DISTRACTION, label: 'Distracted myself', icon: BookOpen },
  { value: ResolutionMethod.PASSED_ON_OWN, label: 'It passed on its own', icon: Smile },
  { value: ResolutionMethod.MOTIVATIONAL, label: 'Read a motivational message', icon: MessageCircle },
  { value: ResolutionMethod.JOURNALED, label: 'Journaled about it', icon: Clipboard },
  { value: ResolutionMethod.SMOKED, label: 'I smoked', icon: Cigarette },
]

const shell =
  'h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden relative bg-[#F4FBFF]'

function SkyWash() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-48"
      style={{
        background:
          'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139, 205, 232, 0.35), transparent 70%)',
      }}
      aria-hidden
    />
  )
}

function IconBubble({
  icon: Icon,
  tone = 'blue',
}: {
  icon: typeof Wind
  tone?: 'blue' | 'orange' | 'green' | 'red' | 'soft'
}) {
  const tones = {
    blue: 'bg-[#E8F4FC] text-[#3F8DD2]',
    orange: 'bg-[#FFF1E6] text-[#E8894A]',
    green: 'bg-[#EAF6F1] text-[#6EA48F]',
    red: 'bg-[#FDECEC] text-[#D96B6B]',
    soft: 'bg-[#F4FBFF] text-[#0E2538]/55',
  }
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
      <Icon className="w-5 h-5" strokeWidth={2.25} />
    </div>
  )
}

export default function CravingSupport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, userProfile, refreshProgress } = useApp()
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
    if (user?.id) fetchCravings({ limit: 50 })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get('slip') === 'true') {
      setSlipped(true)
      setShowLogForm(true)
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
    } catch {
      /* fallback */
    }
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
  }

  const showMotivationalMessage = async () => {
    const quote = await getRandomQuote()
    setCurrentQuote(quote)
    setShowQuoteModal(true)
    analyticsService.trackEvent('motivational_message_viewed', {}, user?.id)
  }

  const handleCallSupportBuddy = () => {
    alert('Support buddy feature coming soon!')
    analyticsService.trackEvent('support_buddy_clicked', {}, user?.id)
  }

  const handleLogCraving = () => setShowLogForm(true)

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
        await analyticsService.trackCravingLogged(user.id, slipped ? 'slip' : 'craving', trigger)
        await refreshProgress()
        await achievementService.checkAndUnlock(user.id)
        behaviorProfileService.computeAndSave(user.id).catch(() => {})
        behaviorTracker.trackCravingLogged(
          String(trigger),
          intensity,
          slipped ? 'slip' : 'craving'
        )

        // AI interventions — respect craving alert pref
        if (userProfile?.enable_craving_alerts !== false) {
          if (slipped) {
            aiNotificationScheduler.triggerSlipRecovery(user.id).catch(() => {})
          } else {
            const windowMs = 2 * 60 * 60 * 1000
            const recentInWindow = cravings.filter((c) => {
              const t = new Date(c.created || '').getTime()
              return Number.isFinite(t) && Date.now() - t < windowMs
            }).length
            if (shouldTriggerCravingSpike(intensity, recentInWindow + 1)) {
              aiNotificationScheduler.triggerCravingSpike(user.id).catch(() => {})
            }
          }
        }

        const cravingsThisWeek = cravings.filter((c) => {
          const cravingDate = new Date(c.created || '')
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return cravingDate >= weekAgo && c.type === CravingType.CRAVING
        }).length

        setEncouragementMessage(
          slipped
            ? "It's okay. Tomorrow is a new day. You've come this far — keep going!"
            : `Great job! You've resisted ${cravingsThisWeek + 1} craving${cravingsThisWeek > 0 ? 's' : ''} this week.`
        )
        setShowEncouragement(true)
        setIntensity(3)
        setTrigger('')
        setCustomTrigger('')
        setAutomaticThought('')
        setNotes('')
        setSlipped(false)
        setShowLogForm(false)

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
      title: '5-minute breathing',
      subtitle: 'Calm the urge with guided breath',
      tone: 'blue' as const,
      onClick: () => {
        analyticsService.trackEvent('quick_action_clicked', { action: 'breathing' }, user?.id)
        navigate('/breathing')
      },
    },
    {
      icon: MessageCircle,
      title: 'Motivational message',
      subtitle: 'A short reminder of why you started',
      tone: 'orange' as const,
      onClick: showMotivationalMessage,
    },
    {
      icon: Phone,
      title: 'Call support buddy',
      subtitle: 'Reach someone who has your back',
      tone: 'green' as const,
      onClick: handleCallSupportBuddy,
    },
    {
      icon: Clipboard,
      title: 'Log this craving',
      subtitle: 'Track intensity and what triggered it',
      tone: 'blue' as const,
      onClick: handleLogCraving,
    },
    {
      icon: Cigarette,
      title: 'I smoked — log a slip',
      subtitle: 'No judgment. Learn and keep going',
      tone: 'red' as const,
      onClick: () => {
        setSlipped(true)
        handleLogCraving()
        analyticsService.trackEvent('quick_action_clicked', { action: 'log_slip' }, user?.id)
      },
    },
  ]

  if (showLogForm) {
    return (
      <div className={shell}>
        <SkyWash />
        <div className="flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin pb-28 relative z-10">
          <header className="flex items-center justify-between pt-4 pb-4">
            <button
              type="button"
              onClick={() => {
                setShowLogForm(false)
                setSlipped(false)
                setError('')
              }}
              className={appHeaderBtn}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#0E2538]/70" />
            </button>
            <h1 className="text-lg font-bold text-[#0E2538]">
              <TranslatedText text={slipped ? 'Log a Slip' : 'Log Craving'} />
            </h1>
            <span className="w-10" aria-hidden />
          </header>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
          >
            {slipped && (
              <div className="mb-5 p-4 rounded-2xl bg-[#FDECEC] border border-[#D96B6B]/20 text-center">
                <p className="text-sm font-semibold text-[#C45A5A]">
                  It&apos;s okay. Tomorrow is a new day.
                </p>
                <p className="text-xs text-[#0E2538]/50 mt-1">
                  Logging this slip helps you learn and keep going.
                </p>
              </div>
            )}

            <h2 className="text-lg font-bold text-[#0E2538] mb-4">
              {slipped ? 'Tell us what happened' : 'How intense is this craving?'}
            </h2>

            <div className="mb-6">
              <div className="flex justify-between gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setIntensity(level)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                      intensity === level
                        ? 'bg-[#E8F4FC] border-[#3F8DD2] scale-110 shadow-sm'
                        : 'bg-[#F4FBFF] border-[#0E2538]/08'
                    }`}
                  >
                    {level <= 2 ? (
                      <Smile className="w-5 h-5 text-[#6EA48F]" />
                    ) : level === 3 ? (
                      <span className="text-base text-[#0E2538]/50">·</span>
                    ) : (
                      <Frown className="w-5 h-5 text-[#E8894A]" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs font-medium text-[#0E2538]/45">
                {intensity <= 2 ? 'Mild' : intensity === 3 ? 'Moderate' : 'Strong'}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#0E2538] mb-2">
                What triggered it?
              </label>
              <div className="flex flex-wrap gap-2">
                {triggers.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTrigger(t.value)}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                      trigger === t.value
                        ? 'bg-[#E8F4FC] border-[#3F8DD2] text-[#3F8DD2]'
                        : 'bg-[#F4FBFF] border-[#0E2538]/08 text-[#0E2538]/70'
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
                  className="mt-3 w-full rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] px-3 py-2.5 text-sm text-[#0E2538]"
                />
              )}
            </div>

            {trigger && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#0E2538] mb-2">
                  {TRIGGER_THOUGHT_PROMPTS[trigger as CravingTrigger] ||
                    'What thought came just before?'}
                </label>
                <textarea
                  value={automaticThought}
                  onChange={(e) => setAutomaticThought(e.target.value)}
                  placeholder="e.g. 'I deserve a break' or 'Just one won't hurt'"
                  className="w-full min-h-[80px] resize-none rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] px-3 py-2.5 text-sm text-[#0E2538]"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#0E2538] mb-2">
                Any notes? (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling?"
                className="w-full min-h-[100px] resize-none rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] px-3 py-2.5 text-sm text-[#0E2538]"
              />
            </div>

            {!slipped && (
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#0E2538]">Did you slip?</span>
                <button
                  type="button"
                  onClick={() => setSlipped(!slipped)}
                  className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                    slipped ? 'bg-[#D96B6B]' : 'bg-[#0E2538]/20'
                  }`}
                  aria-pressed={slipped}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      slipped ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            )}

            {error && <p className="text-sm text-[#D96B6B] mb-3 text-center">{error}</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={
                loading || !trigger || (trigger === CravingTrigger.OTHER && !customTrigger.trim())
              }
              className="w-full py-3.5 rounded-2xl bg-[#3F8DD2] text-white font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </motion.section>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (showResolutionPicker) {
    const handleResolution = async (method: ResolutionMethod | null) => {
      if (method && lastCravingId && user?.id) {
        try {
          const { pb } = await import('../lib/pocketbase')
          await pb.collection('cravings').update(lastCravingId, { resolution_method: method })
        } catch {
          /* non-critical */
        }
      }
      setShowResolutionPicker(false)
      navigate('/home')
    }

    return (
      <div className={shell}>
        <SkyWash />
        <div className="flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin pb-28 relative z-10 flex flex-col justify-center">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
          >
            <h2 className="text-lg font-bold text-[#0E2538] mb-1 text-center">
              How did you get through it?
            </h2>
            <p className="text-sm text-[#0E2538]/50 text-center mb-5">
              This helps us personalize your support
            </p>
            <div className="space-y-2">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleResolution(opt.value)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-[#0E2538]/08 bg-[#F4FBFF] hover:bg-[#E8F4FC]/60 text-left transition-colors"
                >
                  <IconBubble icon={opt.icon} tone={opt.value === ResolutionMethod.SMOKED ? 'red' : 'blue'} />
                  <span className="text-sm font-medium text-[#0E2538]">{opt.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleResolution(null)}
                className="w-full text-center py-2.5 text-sm text-[#0E2538]/40"
              >
                Skip
              </button>
            </div>
          </motion.section>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (showEncouragement && slipped) {
    return <SlipRecovery daysFree={0} onDismiss={() => navigate('/home')} />
  }

  if (showEncouragement) {
    return (
      <div className={shell}>
        <SkyWash />
        <div className="flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin pb-28 relative z-10 flex flex-col justify-center">
          <motion.section
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white p-8 text-center shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EAF6F1] flex items-center justify-center">
              <Smile className="w-8 h-8 text-[#6EA48F]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0E2538] mb-2">Great job!</h2>
            <p className="text-[#0E2538]/65 text-base mb-6 leading-relaxed">{encouragementMessage}</p>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="w-full py-3.5 rounded-2xl bg-[#3F8DD2] text-white font-semibold text-sm"
            >
              Back to Home
            </button>
          </motion.section>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className={shell}>
      <SkyWash />
      <div className="flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin pb-28 relative z-10">
        <AppHeader title="Support" />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl bg-white p-6 mb-5 text-center shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
        >
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-[#E8F4FC] border-4 border-[#3F8DD2]/15 flex items-center justify-center overflow-hidden">
            <Mascot size="md" />
          </div>
          <h2 className="text-xl font-bold text-[#0E2538] mb-1">
            <TranslatedText text="We're here to help" />
          </h2>
          <p className="text-sm text-[#0E2538]/55 leading-relaxed">
            This feeling will pass. Pick what you need right now.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-5"
        >
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Quick actions" />
          </h3>
          <div className="rounded-3xl bg-white shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white overflow-hidden divide-y divide-[#0E2538]/06">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={action.onClick}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-[#F4FBFF] active:bg-[#E8F4FC]/50 transition-colors"
                >
                  <IconBubble icon={Icon} tone={action.tone} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0E2538]">{action.title}</p>
                    <p className="text-xs text-[#0E2538]/45 mt-0.5 truncate">{action.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0E2538]/25 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </motion.section>

        {cravings.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowHistoryModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#3F8DD2]/25 bg-white text-[#3F8DD2] text-sm font-semibold shadow-sm"
          >
            <History className="w-4 h-4" />
            <TranslatedText text="View craving history" />
          </motion.button>
        )}
      </div>

      <BottomNavigation />

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

      <CravingHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        cravings={cravings}
      />
    </div>
  )
}
