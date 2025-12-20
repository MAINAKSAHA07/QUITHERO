import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { EmotionalState } from '../../types/enums'

interface EmotionalStatesProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

const EMOTIONAL_STATE_OPTIONS = [
  {
    value: EmotionalState.STRESSED,
    label: 'Stressed',
    description: 'Feeling overwhelmed or under pressure',
    icon: '😤',
  },
  {
    value: EmotionalState.ANXIOUS,
    label: 'Anxious',
    description: 'Worried, nervous, or uneasy',
    icon: '😰',
  },
  {
    value: EmotionalState.BORED,
    label: 'Bored',
    description: 'Nothing to do, restless, or unstimulated',
    icon: '😑',
  },
  {
    value: EmotionalState.LONELY,
    label: 'Lonely',
    description: 'Feeling isolated or disconnected',
    icon: '😔',
  },
  {
    value: EmotionalState.SAD_STATE,
    label: 'Sad',
    description: 'Feeling down or melancholic',
    icon: '😢',
  },
  {
    value: EmotionalState.ANGRY,
    label: 'Angry',
    description: 'Frustrated, irritated, or upset',
    icon: '😠',
  },
  {
    value: EmotionalState.HAPPY,
    label: 'Happy',
    description: 'Celebrating or feeling good',
    icon: '😊',
  },
  {
    value: EmotionalState.EXCITED,
    label: 'Excited',
    description: 'Energized, enthusiastic, or anticipating',
    icon: '🤩',
  },
]

export default function EmotionalStates({
  step,
  totalSteps,
  onNext,
  onBack,
}: EmotionalStatesProps) {
  const { user } = useApp()
  const [selectedStates, setSelectedStates] = useState<EmotionalState[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleToggleState = (state: EmotionalState) => {
    setSelectedStates((prev) => {
      if (prev.includes(state)) {
        return prev.filter((s) => s !== state)
      } else {
        return [...prev, state]
      }
    })
    setError('')
  }

  const handleSubmit = async () => {
    if (selectedStates.length === 0) {
      setError('Please select at least one emotional state')
      return
    }

    if (!user?.id) {
      setError('User not found')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await profileService.upsert(user.id, {
        emotional_states: selectedStates,
      })

      if (result.success) {
        onNext()
      } else {
        setError(result.error || 'Failed to save emotional states')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Failed to save emotional states:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <TopNavigation
        left="back"
        center={`Step ${step}/${totalSteps}`}
        right=""
      />

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 glass rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <GlassCard className="p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">💭</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              How Do You Feel When You Smoke?
            </h2>
            <p className="text-text-primary/70">
              Select all emotions you commonly experience right before or while smoking.
              Understanding your emotional patterns is key to quitting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {EMOTIONAL_STATE_OPTIONS.map((state) => {
              const isSelected = selectedStates.includes(state.value)
              return (
                <motion.button
                  key={state.value}
                  onClick={() => handleToggleState(state.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-border-subtle glass-subtle hover:border-brand-primary/50'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-3xl mb-2">{state.icon}</div>
                  <div className="font-semibold text-text-primary text-sm mb-1">
                    {state.label}
                  </div>
                  <div className="text-xs text-text-primary/60">
                    {state.description}
                  </div>
                  <div
                    className={`mt-2 mx-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary'
                        : 'border-border-subtle'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {selectedStates.length > 0 && (
            <div className="mt-4 p-3 rounded-lg glass-subtle">
              <p className="text-sm text-text-primary/70">
                Selected {selectedStates.length} emotional state
                {selectedStates.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </GlassCard>

        {/* Navigation */}
        <div className="flex gap-3">
          <GlassButton
            variant="secondary"
            onClick={onBack}
            className="flex-1 py-4 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </GlassButton>
          <GlassButton
            onClick={handleSubmit}
            disabled={isLoading || selectedStates.length === 0}
            className="flex-1 py-4 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </GlassButton>
        </div>
      </div>
    </div>
  )
}
