import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { CravingTrigger } from '../../types/enums'

interface TriggerSelectionProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

const TRIGGER_OPTIONS = [
  {
    value: CravingTrigger.STRESS,
    label: 'Stress',
    description: 'Work pressure, deadlines, or overwhelming situations',
    icon: '😰',
  },
  {
    value: CravingTrigger.BOREDOM,
    label: 'Boredom',
    description: 'Nothing to do, feeling restless or unstimulated',
    icon: '😑',
  },
  {
    value: CravingTrigger.SOCIAL,
    label: 'Social Situations',
    description: 'Being around other smokers, parties, or gatherings',
    icon: '👥',
  },
  {
    value: CravingTrigger.HABIT,
    label: 'Habit/Routine',
    description: 'After meals, with coffee, driving, or specific times',
    icon: '🔄',
  },
  {
    value: CravingTrigger.OTHER,
    label: 'Other',
    description: 'Specific personal triggers not listed above',
    icon: '💭',
  },
]

export default function TriggerSelection({
  step,
  totalSteps,
  onNext,
  onBack,
}: TriggerSelectionProps) {
  const { user } = useApp()
  const [selectedTriggers, setSelectedTriggers] = useState<CravingTrigger[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleToggleTrigger = (trigger: CravingTrigger) => {
    setSelectedTriggers((prev) => {
      if (prev.includes(trigger)) {
        return prev.filter((t) => t !== trigger)
      } else {
        return [...prev, trigger]
      }
    })
    setError('')
  }

  const handleSubmit = async () => {
    if (selectedTriggers.length === 0) {
      setError('Please select at least one trigger')
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
        smoking_triggers: selectedTriggers,
      })

      if (result.success) {
        onNext()
      } else {
        setError(result.error || 'Failed to save triggers')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Failed to save triggers:', err)
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
            <div className="text-4xl mb-3">🎯</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              What Triggers Your Smoking?
            </h2>
            <p className="text-text-primary/70">
              Select all situations that make you reach for a cigarette. This helps us
              personalize your quit plan.
            </p>
          </div>

          <div className="space-y-3">
            {TRIGGER_OPTIONS.map((trigger) => {
              const isSelected = selectedTriggers.includes(trigger.value)
              return (
                <motion.button
                  key={trigger.value}
                  onClick={() => handleToggleTrigger(trigger.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-border-subtle glass-subtle hover:border-brand-primary/50'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{trigger.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary mb-1">
                        {trigger.label}
                      </div>
                      <div className="text-sm text-text-primary/70">
                        {trigger.description}
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary'
                          : 'border-border-subtle'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
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

          {selectedTriggers.length > 0 && (
            <div className="mt-4 p-3 rounded-lg glass-subtle">
              <p className="text-sm text-text-primary/70">
                Selected {selectedTriggers.length} trigger
                {selectedTriggers.length !== 1 ? 's' : ''}
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
            disabled={isLoading || selectedTriggers.length === 0}
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
