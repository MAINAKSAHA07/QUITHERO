import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'

interface FearIndexProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

const FEAR_LABELS = [
  { value: 0, label: 'Not afraid at all', emoji: '😌' },
  { value: 1, label: 'Slightly concerned', emoji: '🙂' },
  { value: 2, label: 'A bit worried', emoji: '😐' },
  { value: 3, label: 'Somewhat afraid', emoji: '😕' },
  { value: 4, label: 'Moderately afraid', emoji: '😟' },
  { value: 5, label: 'Quite afraid', emoji: '😨' },
  { value: 6, label: 'Very afraid', emoji: '😰' },
  { value: 7, label: 'Extremely afraid', emoji: '😱' },
  { value: 8, label: 'Terrified', emoji: '😭' },
  { value: 9, label: 'Overwhelmed with fear', emoji: '💀' },
  { value: 10, label: 'Maximum fear', emoji: '🚨' },
]

export default function FearIndex({
  step,
  totalSteps,
  onNext,
  onBack,
}: FearIndexProps) {
  const { user } = useApp()
  const [fearValue, setFearValue] = useState(5) // Start at midpoint
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const currentLabel = FEAR_LABELS[fearValue]

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('User not found')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await profileService.upsert(user.id, {
        fear_index: fearValue,
      })

      if (result.success) {
        onNext()
      } else {
        setError(result.error || 'Failed to save fear index')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Failed to save fear index:', err)
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
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">❤️‍🔥</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              How Afraid Are You?
            </h2>
            <p className="text-text-primary/70">
              On a scale of 0 to 10, how afraid are you of the health consequences of
              continued smoking?
            </p>
          </div>

          {/* Current value display */}
          <motion.div
            key={fearValue}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8 p-6 rounded-2xl glass-subtle"
          >
            <div className="text-6xl mb-3">{currentLabel.emoji}</div>
            <div className="text-4xl font-bold text-brand-primary mb-2">
              {fearValue}
            </div>
            <div className="text-lg text-text-primary/80">
              {currentLabel.label}
            </div>
          </motion.div>

          {/* Slider */}
          <div className="mb-8">
            <input
              type="range"
              min="0"
              max="10"
              value={fearValue}
              onChange={(e) => setFearValue(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right,
                  rgb(34, 197, 94) 0%,
                  rgb(234, 179, 8) 50%,
                  rgb(239, 68, 68) 100%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-sm text-text-primary/50">
              <span>0 - No fear</span>
              <span>10 - Maximum fear</span>
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="grid grid-cols-11 gap-1 mb-4">
            {FEAR_LABELS.map((item) => (
              <button
                key={item.value}
                onClick={() => setFearValue(item.value)}
                className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                  fearValue === item.value
                    ? 'bg-brand-primary text-white scale-110'
                    : 'glass-subtle text-text-primary/50 hover:bg-brand-primary/20'
                }`}
              >
                {item.value}
              </button>
            ))}
          </div>

          <div className="text-xs text-text-primary/50 text-center">
            Tap a number or drag the slider to select your fear level
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
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
            disabled={isLoading}
            className="flex-1 py-4 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </GlassButton>
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid rgb(99, 102, 241);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid rgb(99, 102, 241);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}
