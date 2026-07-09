import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, Wind, Pause, Play } from 'lucide-react'
import { appHeaderBtn } from '../components/AppHeader'
import TranslatedText from '../components/TranslatedText'
import { useApp } from '../context/AppContext'
import { useJournal } from '../hooks/useJournal'
import { analyticsService } from '../services/analytics.service'
import { pb } from '../lib/pocketbase'
import { Mood, ResolutionMethod } from '../types/enums'

async function autoTagCravingResolution(userId: string) {
  const cutoff = new Date(Date.now() - 45 * 60 * 1000).toISOString()
  try {
    const records = await pb.collection('cravings').getFullList({
      filter: `user="${userId}" && resolution_method=""`,
      sort: '-id',
    })
    const recent = records.find((r: any) => {
      const created = r.created || r.updated || ''
      return created >= cutoff
    })
    if (recent) {
      await pb.collection('cravings').update(recent.id, {
        resolution_method: ResolutionMethod.AUTO_BREATHING,
      })
    }
  } catch {
    /* non-critical */
  }
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest'

const TOTAL_ROUNDS = 5
const INHALE_DURATION = 5000
const HOLD_DURATION = 5000
const EXHALE_DURATION = 5000
const REST_DURATION = 2000

const moodOptions = [
  { value: Mood.VERY_HAPPY, label: 'Very Happy', color: 'bg-[#EAF6F1] text-[#6EA48F] border-[#6EA48F]/30' },
  { value: Mood.HAPPY, label: 'Happy', color: 'bg-[#E8F4FC] text-[#3F8DD2] border-[#3F8DD2]/30' },
  { value: Mood.NEUTRAL, label: 'Neutral', color: 'bg-[#F4FBFF] text-[#0E2538]/60 border-[#0E2538]/15' },
  { value: Mood.SAD, label: 'Sad', color: 'bg-[#FFF1E6] text-[#E8894A] border-[#E8894A]/30' },
  { value: Mood.VERY_SAD, label: 'Very Sad', color: 'bg-[#FDECEC] text-[#D96B6B] border-[#D96B6B]/30' },
]

const phaseConfig: Record<
  BreathingPhase,
  { fill: string; glow: string; ring: string; sub: string }
> = {
  inhale: {
    fill: 'bg-[#3F8DD2]',
    glow: 'rgba(63,141,210,0.35)',
    ring: 'bg-[#8BCDE8]/40',
    sub: 'Slowly...',
  },
  hold: {
    fill: 'bg-[#5BA3D9]',
    glow: 'rgba(91,163,217,0.35)',
    ring: 'bg-[#A8D4EA]/45',
    sub: 'Keep holding...',
  },
  exhale: {
    fill: 'bg-[#E8894A]',
    glow: 'rgba(232,137,74,0.35)',
    ring: 'bg-[#F6B884]/40',
    sub: 'Release slowly...',
  },
  rest: {
    fill: 'bg-[#6EA48F]',
    glow: 'rgba(110,164,143,0.35)',
    ring: 'bg-[#A8D4C4]/40',
    sub: 'Take a moment...',
  },
}

const phaseLabel: Record<BreathingPhase, string> = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  rest: 'Rest',
}

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

export default function Breathing() {
  const navigate = useNavigate()
  const { user } = useApp()
  const { createEntry } = useJournal()
  const [phase, setPhase] = useState<BreathingPhase>('inhale')
  const [round, setRound] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.NEUTRAL)
  const [saveToJournal, setSaveToJournal] = useState(false)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const phaseRef = useRef<BreathingPhase>('inhale')
  const roundRef = useRef(1)
  const isPlayingRef = useRef(false)
  const isPausedRef = useRef(false)
  const isCompleteRef = useRef(false)

  useEffect(() => {
    if (user?.id) analyticsService.trackPageView('breathing', user.id)
  }, [user?.id])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    roundRef.current = round
  }, [round])
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])
  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])
  useEffect(() => {
    isCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    if (isPlaying && !isPaused && !isComplete) {
      startBreathingCycle()
    } else if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isPaused, isComplete])

  const startBreathingCycle = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const currentPhase = phaseRef.current
    const currentRound = roundRef.current
    let duration = 0
    let nextPhase: BreathingPhase = 'inhale'

    switch (currentPhase) {
      case 'inhale':
        duration = INHALE_DURATION
        nextPhase = 'hold'
        break
      case 'hold':
        duration = HOLD_DURATION
        nextPhase = 'exhale'
        break
      case 'exhale':
        duration = EXHALE_DURATION
        if (currentRound >= TOTAL_ROUNDS) {
          setIsComplete(true)
          setIsPlaying(false)
          setShowMoodSelector(true)
          if (user?.id) {
            analyticsService.trackEvent(
              'breathing_exercise_completed',
              { rounds: TOTAL_ROUNDS },
              user.id
            )
            autoTagCravingResolution(user.id).catch(() => {})
          }
          return
        }
        nextPhase = 'rest'
        break
      case 'rest':
        duration = REST_DURATION
        nextPhase = 'inhale'
        setRound((prev) => prev + 1)
        break
    }

    timerRef.current = setTimeout(() => {
      setPhase(nextPhase)
      if (isPlayingRef.current && !isPausedRef.current && !isCompleteRef.current) {
        setTimeout(() => startBreathingCycle(), 0)
      }
    }, duration)
  }

  const handleStart = () => {
    setIsPlaying(true)
    setIsPaused(false)
    setPhase('inhale')
    setRound(1)
    setIsComplete(false)
    startTimeRef.current = new Date()
    if (user?.id) analyticsService.trackEvent('breathing_exercise_started', {}, user.id)
  }

  const handlePause = () => {
    setIsPaused(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleResume = () => setIsPaused(false)

  const handleStop = () => {
    setIsPlaying(false)
    setIsPaused(false)
    setPhase('inhale')
    setRound(1)
    setIsComplete(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleSaveToJournal = async () => {
    if (!user?.id || !saveToJournal) {
      setShowMoodSelector(false)
      navigate('/craving')
      return
    }
    setSaving(true)
    try {
      await createEntry({
        date: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        title: 'Breathing Exercise',
        content: `Completed ${TOTAL_ROUNDS} rounds of 5-5-5 breathing exercise. Feeling ${moodOptions.find((m) => m.value === selectedMood)?.label.toLowerCase()}.`,
      })
      setShowMoodSelector(false)
      navigate('/craving')
    } catch (error) {
      console.error('Failed to save to journal:', error)
      setShowMoodSelector(false)
      navigate('/craving')
    } finally {
      setSaving(false)
    }
  }

  const getCircleScale = () => {
    switch (phase) {
      case 'inhale':
        return 1.5
      case 'hold':
        return 1.5
      case 'exhale':
        return 0.8
      case 'rest':
        return 1
      default:
        return 1
    }
  }

  const getPhaseDuration = () => {
    switch (phase) {
      case 'inhale':
        return INHALE_DURATION
      case 'hold':
        return HOLD_DURATION
      case 'exhale':
        return EXHALE_DURATION
      case 'rest':
        return REST_DURATION
      default:
        return 0
    }
  }

  const cfg = phaseConfig[phase]
  const ease = phase === 'inhale' ? 'easeIn' : phase === 'exhale' ? 'easeOut' : 'linear'
  const totalMins = Math.ceil(
    (TOTAL_ROUNDS * (INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION + REST_DURATION)) / 60000
  )

  const goBack = () => {
    if (isPlaying) handleStop()
    navigate('/craving')
  }

  if (showMoodSelector) {
    return (
      <div className={shell}>
        <SkyWash />
        <div className="flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin pb-8 relative z-10 flex flex-col justify-center">
          <motion.section
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white p-6 text-center shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#EAF6F1] flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#6EA48F]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0E2538] mb-1">
              <TranslatedText text="Exercise complete" />
            </h2>
            <p className="text-sm text-[#0E2538]/55 mb-6">How do you feel now?</p>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSelectedMood(mood.value)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                    selectedMood === mood.value
                      ? `${mood.color} scale-105 shadow-sm`
                      : 'bg-[#F4FBFF] border-[#0E2538]/08 text-[#0E2538]/45'
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>

            <label className="flex items-center justify-center gap-2 text-sm text-[#0E2538]/70 mb-5">
              <input
                type="checkbox"
                checked={saveToJournal}
                onChange={(e) => setSaveToJournal(e.target.checked)}
                className="w-4 h-4 accent-[#3F8DD2] rounded"
              />
              <span>Save to Journal</span>
            </label>

            <button
              type="button"
              onClick={handleSaveToJournal}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[#3F8DD2] text-white font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {saving ? 'Saving...' : 'Done'}
            </button>
          </motion.section>
        </div>
      </div>
    )
  }

  return (
    <div className={shell}>
      <SkyWash />
      <div className="flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin pb-8 relative z-10 flex flex-col">
        <header className="flex items-center justify-between pt-4 pb-4 flex-shrink-0">
          <button type="button" onClick={goBack} className={appHeaderBtn} aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-[#0E2538]/70" />
          </button>
          <h1 className="text-lg font-bold text-[#0E2538]">
            <TranslatedText text="Breathing" />
          </h1>
          <span className="w-10" aria-hidden />
        </header>

        {!isPlaying ? (
          <div className="flex-1 flex flex-col">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-white p-6 mb-5 text-center shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
            >
              <div className="relative flex items-center justify-center mb-4">
                <motion.div
                  className="absolute rounded-full bg-[#8BCDE8]/25"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 140, height: 140, filter: 'blur(14px)' }}
                />
                <motion.div
                  className="relative w-24 h-24 rounded-full bg-[#E8F4FC] border-4 border-[#3F8DD2]/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Wind className="w-10 h-10 text-[#3F8DD2]" strokeWidth={2} />
                </motion.div>
              </div>

              <h2 className="text-xl font-bold text-[#0E2538] mb-1">5-5-5 Breathing</h2>
              <p className="text-sm text-[#0E2538]/55 leading-relaxed max-w-[280px] mx-auto">
                Follow the circle and breathe in sync to relax and ease cravings.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="mb-5"
            >
              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: 'Breathe In', secs: '5s', tone: 'bg-[#E8F4FC] text-[#3F8DD2]' },
                  { step: 'Hold', secs: '5s', tone: 'bg-[#F0F7FC] text-[#5BA3D9]' },
                  { step: 'Breathe Out', secs: '5s', tone: 'bg-[#FFF1E6] text-[#E8894A]' },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`flex flex-col items-center gap-1 p-3.5 rounded-2xl border border-white shadow-[0_4px_16px_rgba(63,141,210,0.06)] ${s.tone.split(' ')[0]}`}
                  >
                    <span className={`text-lg font-extrabold ${s.tone.split(' ')[1]}`}>{s.secs}</span>
                    <span className="text-[10px] font-semibold text-[#0E2538]/55 text-center leading-tight">
                      {s.step}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-[#0E2538]/40 font-medium mt-3">
                {TOTAL_ROUNDS} rounds · ~{totalMins} min
              </p>
            </motion.section>

            <div className="mt-auto">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3.5 rounded-2xl bg-[#3F8DD2] text-white font-semibold text-sm active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(63,141,210,0.25)]"
              >
                Start Exercise
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-between py-4"
          >
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="text-sm font-semibold text-[#0E2538]/50">
                Round {round} of {TOTAL_ROUNDS}
              </p>
              <div className="flex gap-2 items-center">
                {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i < round - 1
                        ? 'w-6 h-2 bg-[#3F8DD2]'
                        : i === round - 1
                          ? 'w-6 h-2 bg-[#3F8DD2]/50'
                          : 'w-2 h-2 bg-[#0E2538]/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center my-6">
              <motion.div
                className="absolute rounded-full"
                animate={{
                  scale: getCircleScale() * 1.4,
                  opacity: [0.3, 0.55, 0.3],
                }}
                transition={{
                  scale: { duration: getPhaseDuration() / 1000, ease },
                  opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{
                  width: 200,
                  height: 200,
                  background: cfg.glow,
                  filter: 'blur(28px)',
                }}
              />
              <motion.div
                className={`absolute rounded-full ${cfg.ring}`}
                animate={{ scale: getCircleScale() * 1.18 }}
                transition={{ duration: getPhaseDuration() / 1000, ease }}
                style={{ width: 190, height: 190 }}
              />
              <motion.div
                className={`relative rounded-full ${cfg.fill} flex items-center justify-center shadow-[0_12px_40px_rgba(63,141,210,0.25)]`}
                animate={{ scale: getCircleScale() }}
                transition={{ duration: getPhaseDuration() / 1000, ease }}
                style={{ width: 180, height: 180 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="text-center px-4"
                  >
                    <div className="text-xl font-extrabold text-white mb-1">{phaseLabel[phase]}</div>
                    <div className="text-xs text-white/80 font-medium">{cfg.sub}</div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            <div className="flex gap-3 w-full">
              {isPaused ? (
                <button
                  type="button"
                  onClick={handleResume}
                  className="flex-1 py-3.5 rounded-2xl bg-[#3F8DD2] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="flex-1 py-3.5 rounded-2xl bg-white border border-[#3F8DD2]/20 text-[#0E2538] font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              <button
                type="button"
                onClick={handleStop}
                className="flex-1 py-3.5 rounded-2xl bg-white border border-[#0E2538]/10 text-[#0E2538]/50 font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Stop
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
