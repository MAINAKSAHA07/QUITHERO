import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
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
  } catch { /* non-critical */ }
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest'

const TOTAL_ROUNDS = 5
const INHALE_DURATION = 5000
const HOLD_DURATION = 5000
const EXHALE_DURATION = 5000
const REST_DURATION = 2000

const moodOptions = [
  { value: Mood.VERY_HAPPY, emoji: '😊', label: 'Very Happy' },
  { value: Mood.HAPPY, emoji: '🙂', label: 'Happy' },
  { value: Mood.NEUTRAL, emoji: '😐', label: 'Neutral' },
  { value: Mood.SAD, emoji: '😔', label: 'Sad' },
  { value: Mood.VERY_SAD, emoji: '😢', label: 'Very Sad' },
]

const phaseConfig: Record<BreathingPhase, { gradient: string; glow: string; sub: string }> = {
  inhale:  { gradient: 'from-brand-primary to-sky-300',    glow: 'rgba(168,212,234,0.4)',  sub: 'Slowly...' },
  hold:    { gradient: 'from-violet-400 to-brand-primary', glow: 'rgba(167,139,250,0.4)',  sub: 'Keep holding...' },
  exhale:  { gradient: 'from-brand-accent to-rose-300',    glow: 'rgba(253,180,123,0.4)',  sub: 'Release slowly...' },
  rest:    { gradient: 'from-emerald-300 to-teal-300',     glow: 'rgba(110,231,183,0.35)', sub: 'Take a moment...' },
}

const phaseLabel: Record<BreathingPhase, string> = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  rest: 'Rest',
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

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])
  useEffect(() => { isCompleteRef.current = isComplete }, [isComplete])

  useEffect(() => {
    if (isPlaying && !isPaused && !isComplete) {
      startBreathingCycle()
    } else {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isPaused, isComplete])

  const startBreathingCycle = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const currentPhase = phaseRef.current
    const currentRound = roundRef.current
    let duration = 0
    let nextPhase: BreathingPhase = 'inhale'

    switch (currentPhase) {
      case 'inhale': duration = INHALE_DURATION; nextPhase = 'hold'; break
      case 'hold':   duration = HOLD_DURATION;   nextPhase = 'exhale'; break
      case 'exhale':
        duration = EXHALE_DURATION
        if (currentRound >= TOTAL_ROUNDS) {
          setIsComplete(true)
          setIsPlaying(false)
          setShowMoodSelector(true)
          if (user?.id) {
            analyticsService.trackEvent('breathing_exercise_completed', { rounds: TOTAL_ROUNDS }, user.id)
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
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  const handleResume = () => setIsPaused(false)

  const handleStop = () => {
    setIsPlaying(false)
    setIsPaused(false)
    setPhase('inhale')
    setRound(1)
    setIsComplete(false)
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  const handleSaveToJournal = async () => {
    if (!user?.id || !saveToJournal) {
      setShowMoodSelector(false)
      navigate('/home')
      return
    }
    setSaving(true)
    try {
      await createEntry({
        date: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        title: 'Breathing Exercise',
        content: `Completed ${TOTAL_ROUNDS} rounds of 5-5-5 breathing exercise. Feeling ${moodOptions.find(m => m.value === selectedMood)?.label.toLowerCase()}.`,
      })
      setShowMoodSelector(false)
      navigate('/home')
    } catch (error) {
      console.error('Failed to save to journal:', error)
      setShowMoodSelector(false)
      navigate('/home')
    } finally {
      setSaving(false)
    }
  }

  const getCircleScale = () => {
    switch (phase) {
      case 'inhale': return 1.5
      case 'hold':   return 1.5
      case 'exhale': return 0.8
      case 'rest':   return 1
      default:       return 1
    }
  }

  const getPhaseDuration = () => {
    switch (phase) {
      case 'inhale': return INHALE_DURATION
      case 'hold':   return HOLD_DURATION
      case 'exhale': return EXHALE_DURATION
      case 'rest':   return REST_DURATION
      default:       return 0
    }
  }

  const cfg = phaseConfig[phase]
  const ease = phase === 'inhale' ? 'easeIn' : phase === 'exhale' ? 'easeOut' : 'linear'

  // ── Mood Selector (post-completion) ──────────────────────────────────────
  if (showMoodSelector) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <GlassCard className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-6"
            >
              <CheckCircle className="w-16 h-16 text-success mx-auto" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Exercise Complete!</h2>
            <p className="text-text-primary/70 mb-6">How do you feel now?</p>
            <div className="flex gap-3 justify-center mb-6">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`text-4xl transition-all ${selectedMood === mood.value ? 'scale-125 drop-shadow-lg' : 'opacity-50'}`}
                  title={mood.label}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
            <div className="mb-6">
              <label className="flex items-center justify-center gap-2 text-text-primary">
                <input
                  type="checkbox"
                  checked={saveToJournal}
                  onChange={(e) => setSaveToJournal(e.target.checked)}
                  className="w-4 h-4 accent-brand-primary"
                />
                <span>Save to Journal</span>
              </label>
            </div>
            <GlassButton onClick={handleSaveToJournal} fullWidth className="py-4" disabled={saving}>
              {saving ? 'Saving...' : 'Done'}
            </GlassButton>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  // ── Main Screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavigation
        left="back"
        center="5-5-5 Breathing"
        right={
          <button onClick={() => navigate('/home')}>
            <X className="w-6 h-6 text-text-primary" />
          </button>
        }
      />

      {!isPlaying ? (
        /* ── Start Screen ── */
        <div className="flex-1 flex flex-col px-5 pt-2 pb-8">
          {/* Hero */}
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            {/* Animated orb */}
            <div className="relative flex items-center justify-center mb-2">
              <motion.div
                className="absolute rounded-full bg-gradient-to-br from-brand-primary/20 to-sky-300/20"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 160, height: 160, filter: 'blur(16px)' }}
              />
              <motion.div
                className="relative w-28 h-28 rounded-full bg-gradient-to-br from-brand-primary/15 to-sky-300/20 border border-brand-primary/20 backdrop-blur-sm flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-5xl">🌊</span>
              </motion.div>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">
                5-5-5 Breathing
              </h1>
              <p className="text-text-primary/60 text-base leading-relaxed max-w-[260px] mx-auto">
                Follow the circle and breathe in sync to relax and ease cravings.
              </p>
            </div>

            {/* Step cards */}
            <div className="grid grid-cols-3 gap-2 w-full mt-2">
              {[
                { emoji: '🫁', step: 'Breathe In', secs: '5s', color: 'from-brand-primary/10 to-sky-300/10 border-brand-primary/20' },
                { emoji: '⏸️', step: 'Hold',       secs: '5s', color: 'from-violet-400/10 to-brand-primary/10 border-violet-300/20' },
                { emoji: '💨', step: 'Breathe Out', secs: '5s', color: 'from-brand-accent/10 to-rose-300/10 border-brand-accent/20' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-br ${s.color} border backdrop-blur-sm`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-[10px] font-bold text-text-primary/70 text-center leading-tight">{s.step}</span>
                  <span className="text-xs font-extrabold text-brand-primary">{s.secs}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-primary/40 font-medium">
              {TOTAL_ROUNDS} rounds · ~{Math.ceil((TOTAL_ROUNDS * (INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION + REST_DURATION)) / 60000)} min
            </p>
          </div>

          {/* CTA */}
          <motion.button
            onClick={handleStart}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold text-lg shadow-lg active:opacity-90 transition-all"
          >
            Start Exercise
          </motion.button>
        </div>

      ) : (
        /* ── Active Session ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-between px-6 pt-4 pb-10"
        >
          {/* Round dots */}
          <div className="flex flex-col items-center gap-2 w-full">
            <p className="text-text-primary/50 text-sm font-semibold tracking-wide">
              Round {round} of {TOTAL_ROUNDS}
            </p>
            <div className="flex gap-2 items-center">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i < round - 1
                      ? 'w-6 h-2 bg-gradient-to-r from-brand-primary to-brand-accent'
                      : i === round - 1
                      ? 'w-6 h-2 bg-brand-primary/60'
                      : 'w-2 h-2 bg-white/30 border border-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Breathing Orb */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow */}
            <motion.div
              className="absolute rounded-full"
              animate={{
                scale: getCircleScale() * 1.4,
                opacity: [0.3, 0.6, 0.3],
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
            {/* Mid ring */}
            <motion.div
              className={`absolute rounded-full bg-gradient-to-br ${cfg.gradient} opacity-25`}
              animate={{ scale: getCircleScale() * 1.18 }}
              transition={{ duration: getPhaseDuration() / 1000, ease }}
              style={{ width: 190, height: 190 }}
            />
            {/* Main orb */}
            <motion.div
              className={`relative rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-2xl`}
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
                  <div className="text-xl font-extrabold text-white drop-shadow mb-1">
                    {phaseLabel[phase]}
                  </div>
                  <div className="text-xs text-white/75 font-medium">{cfg.sub}</div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 w-full max-w-xs">
            {isPaused ? (
              <button
                onClick={handleResume}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold text-sm shadow-lg active:scale-[0.97] transition-all"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/40 backdrop-blur-sm text-text-primary font-semibold text-sm hover:bg-white/60 active:scale-[0.97] transition-all"
              >
                Pause
              </button>
            )}
            <button
              onClick={handleStop}
              className="flex-1 py-3.5 rounded-2xl bg-white/30 border border-white/30 backdrop-blur-sm text-text-primary/60 font-semibold text-sm hover:bg-white/40 active:scale-[0.97] transition-all"
            >
              Stop
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
