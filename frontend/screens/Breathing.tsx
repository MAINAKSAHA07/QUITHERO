import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Music, MusicOff } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import { useApp } from '../context/AppContext'
import { useJournal } from '../hooks/useJournal'
import { analyticsService } from '../services/analytics.service'
import { Mood } from '../types/enums'

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest'

const TOTAL_ROUNDS = 5
const INHALE_DURATION = 5000 // 5 seconds
const HOLD_DURATION = 5000 // 5 seconds
const EXHALE_DURATION = 5000 // 5 seconds
const REST_DURATION = 2000 // 2 seconds

const moodOptions = [
  { value: Mood.VERY_HAPPY, emoji: '😊', label: 'Very Happy' },
  { value: Mood.HAPPY, emoji: '🙂', label: 'Happy' },
  { value: Mood.NEUTRAL, emoji: '😐', label: 'Neutral' },
  { value: Mood.SAD, emoji: '😔', label: 'Sad' },
  { value: Mood.VERY_SAD, emoji: '😢', label: 'Very Sad' },
]

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
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const phaseRef = useRef<BreathingPhase>('inhale')
  const roundRef = useRef(1)
  const isPlayingRef = useRef(false)
  const isPausedRef = useRef(false)
  const isCompleteRef = useRef(false)

  useEffect(() => {
    if (user?.id) {
      analyticsService.trackPageView('breathing', user.id)
    }
  }, [user?.id])

  // Keep refs in sync with state
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
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isPaused, isComplete])

  const startBreathingCycle = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Use refs to get current values (avoid stale closures)
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
            analyticsService.trackEvent('breathing_exercise_completed', { rounds: TOTAL_ROUNDS }, user.id)
          }
          return
        } else {
          nextPhase = 'rest'
        }
        break
      case 'rest':
        duration = REST_DURATION
        nextPhase = 'inhale'
        setRound((prev) => prev + 1)
        break
    }

    timerRef.current = setTimeout(() => {
      setPhase(nextPhase)
      // Continue the cycle if still playing and not paused (check refs for latest values)
      if (isPlayingRef.current && !isPausedRef.current && !isCompleteRef.current) {
        // Use a small delay to ensure state updates are processed
        setTimeout(() => {
          startBreathingCycle()
        }, 0)
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
    if (user?.id) {
      analyticsService.trackEvent('breathing_exercise_started', {}, user.id)
    }
  }

  const handlePause = () => {
    setIsPaused(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleResume = () => {
    setIsPaused(false)
  }

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

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In'
      case 'hold':
        return 'Hold'
      case 'exhale':
        return 'Breathe Out'
      case 'rest':
        return 'Rest'
      default:
        return ''
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

  if (showMoodSelector) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto px-4 w-full"
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
                  className={`text-4xl transition-all ${
                    selectedMood === mood.value
                      ? 'scale-125 drop-shadow-lg'
                      : 'opacity-50'
                  }`}
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
                  className="w-4 h-4"
                />
                <span>Save to Journal</span>
              </label>
            </div>

            <GlassButton
              onClick={handleSaveToJournal}
              fullWidth
              className="py-4"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Done'}
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
        center="5-5-5 Breathing"
        right={
          <button onClick={() => navigate('/home')}>
            <X className="w-6 h-6 text-text-primary" />
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {!isPlaying ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <GlassCard className="p-8 mb-6">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full glass-strong flex items-center justify-center">
                <span className="text-6xl">🌊</span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                5-5-5 Breathing Exercise
              </h2>
              <p className="text-text-primary/70 mb-6">
                Follow the circle and breathe in sync. This exercise will help you relax and
                manage cravings.
              </p>
              <div className="text-sm text-text-primary/50 mb-6">
                <p>• 5 seconds: Breathe In</p>
                <p>• 5 seconds: Hold</p>
                <p>• 5 seconds: Breathe Out</p>
                <p className="mt-2">Total: {TOTAL_ROUNDS} rounds</p>
              </div>
              <GlassButton onClick={handleStart} fullWidth className="py-4 text-lg">
                Start Exercise
              </GlassButton>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            {/* Progress Indicator */}
            <div className="mb-6">
              <p className="text-text-primary/70 mb-2">
                Round {round} of {TOTAL_ROUNDS}
              </p>
              <div className="h-2 glass rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((round - 1) / TOTAL_ROUNDS) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Breathing Circle */}
            <div className="mb-8 flex items-center justify-center">
              <motion.div
                className="w-64 h-64 rounded-full glass-strong border-4 border-brand-primary/50 flex items-center justify-center"
                animate={{
                  scale: getCircleScale(),
                }}
                transition={{
                  duration: getPhaseDuration() / 1000,
                  ease: phase === 'inhale' ? 'easeIn' : phase === 'exhale' ? 'easeOut' : 'linear',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <div className="text-4xl font-bold text-brand-primary mb-2">
                      {getPhaseText()}
                    </div>
                    <div className="text-text-primary/70">
                      {phase === 'inhale' && 'Slowly...'}
                      {phase === 'hold' && 'Keep holding...'}
                      {phase === 'exhale' && 'Release slowly...'}
                      {phase === 'rest' && 'Take a moment...'}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center w-full max-w-xs mx-auto">
              {isPaused ? (
                <GlassButton onClick={handleResume} className="flex-1 py-3 min-w-0">
                  Resume
                </GlassButton>
              ) : (
                <GlassButton onClick={handlePause} variant="secondary" className="flex-1 py-3 min-w-0">
                  Pause
                </GlassButton>
              )}
              <GlassButton onClick={handleStop} variant="secondary" className="flex-1 py-3 min-w-0">
                Stop
              </GlassButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

