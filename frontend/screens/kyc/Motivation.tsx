import { useState } from 'react'
import { Heart, DollarSign, Users, TrendingUp, Check } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassButton from '../../components/GlassButton'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'

interface MotivationProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

const motivations = [
  { id: 'health', label: 'Health reasons', icon: Heart },
  { id: 'money', label: 'Save money', icon: DollarSign },
  { id: 'family', label: 'Family/Relationships', icon: Users },
  { id: 'self', label: 'Self-improvement', icon: TrendingUp },
]

export default function Motivation({ step, totalSteps, onNext, onBack }: MotivationProps) {
  const { user, updateUserProfile } = useApp()
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([])
  const [quitReason, setQuitReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleMotivation = (id: string) => {
    setSelectedMotivations((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const handleContinue = async () => {
    if (selectedMotivations.length === 0) {
      setError('Please select at least one motivation')
      return
    }

    if (!quitReason.trim()) {
      setError('Please tell us why you want to quit')
      return
    }

    if (!user?.id) {
      setError('User not found. Please login again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await profileService.upsert(user.id, {
        motivations: selectedMotivations,
        quit_reason: quitReason.trim(),
      })

      if (result.success && result.data) {
        // Update context
        if (updateUserProfile) {
          await updateUserProfile(result.data)
        }
        onNext()
      } else {
        setError(result.error || 'Failed to save. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopNavigation left="back" center={`Step ${step}/${totalSteps}`} right="" />
      
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i + 1 <= step ? 'bg-brand-primary' : 'bg-text-primary/20'
                }`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Why are you quitting?
        </h1>
        <p className="text-text-primary/70 mb-8">
          Select all that apply - this helps us motivate you
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {motivations.map((motivation) => {
            const Icon = motivation.icon
            const isSelected = selectedMotivations.includes(motivation.id)
            return (
              <button
                key={motivation.id}
                onClick={() => toggleMotivation(motivation.id)}
                className={`glass p-4 rounded-xl relative transition-all ${
                  isSelected ? 'ring-2 ring-brand-primary shadow-glow' : ''
                }`}
              >
                <Icon className="w-8 h-8 text-brand-primary mb-2" />
                <div className="text-sm font-medium text-text-primary text-center">
                  {motivation.label}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Tell us more about why you want to quit
          </label>
          <textarea
            value={quitReason}
            onChange={(e) => setQuitReason(e.target.value)}
            placeholder="Share your personal reasons for wanting to quit smoking. This will help us support you better on your journey..."
            className="w-full px-4 py-3 rounded-xl glass text-text-primary placeholder-text-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[120px] resize-none"
            maxLength={500}
          />
          <div className="text-xs text-text-primary/50 mt-1 text-right">
            {quitReason.length}/500 characters
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-error text-center">{error}</p>
        )}

        <div className="flex gap-3 mt-8 w-full">
          <GlassButton variant="secondary" onClick={onBack} className="flex-1 py-4 min-w-0" disabled={loading}>
            Back
          </GlassButton>
          <GlassButton
            onClick={handleContinue}
            disabled={selectedMotivations.length === 0 || !quitReason.trim() || loading}
            className="flex-1 py-4 min-w-0"
          >
            {loading ? 'Saving...' : 'Continue'}
          </GlassButton>
        </div>
      </div>
    </>
  )
}

