import { useState } from 'react'
import { Calendar, Check } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { progressService } from '../../services/progress.service'

interface QuitDateSelectionProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

const options = [
  { id: 'today', label: 'Today', badge: 'Recommended' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'custom', label: 'Custom Date' },
]

export default function QuitDateSelection({ step, totalSteps, onNext, onBack }: QuitDateSelectionProps) {
  const { user, updateUserProfile } = useApp()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculateQuitDate = (): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (selectedOption) {
      case 'today':
        return today.toISOString().split('T')[0]
      case 'tomorrow':
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      case 'thisWeek':
        // Set to end of week (Sunday)
        const endOfWeek = new Date(today)
        const dayOfWeek = endOfWeek.getDay()
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
        endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday)
        return endOfWeek.toISOString().split('T')[0]
      case 'custom':
        if (!customDate) {
          throw new Error('Please select a custom date')
        }
        return customDate
      default:
        throw new Error('Please select a quit date')
    }
  }

  const handleContinue = async () => {
    if (!selectedOption) {
      setError('Please select a quit date')
      return
    }

    if (selectedOption === 'custom' && !customDate) {
      setError('Please select a custom date')
      return
    }

    if (!user?.id) {
      setError('User not found. Please login again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const quitDate = calculateQuitDate()
      
      // Ensure date is in correct format (YYYY-MM-DD)
      const formattedDate = quitDate.split('T')[0]

      // Update user profile with quit_date
      const result = await profileService.upsert(user.id, {
        quit_date: formattedDate,
      })

      if (result.success && result.data) {
        // Initialize progress_stats record
        await progressService.calculateProgress(user.id)

        // Update context
        if (updateUserProfile) {
          await updateUserProfile(result.data)
        }
        onNext()
      } else {
        // Handle detailed error messages
        const errorMsg = result.error || 'Failed to save quit date. Please try again.'
        console.error('Failed to save quit date:', result.error, { quitDate: formattedDate, userId: user.id })
        setError(errorMsg)
      }
    } catch (err: any) {
      console.error('Error in handleContinue:', err)
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
          When do you want to quit?
        </h1>
        <p className="text-text-primary/70 mb-8">
          Choose your quit date to start your journey
        </p>

        <div className="space-y-3 mb-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`glass p-4 rounded-xl w-full text-left relative transition-all ${
                selectedOption === option.id
                  ? 'ring-2 ring-brand-primary shadow-glow'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-brand-primary" />
                  <span className="font-medium text-text-primary">{option.label}</span>
                </div>
                {option.badge && (
                  <span className="text-xs px-2 py-1 rounded-full bg-brand-primary/20 text-brand-primary">
                    {option.badge}
                  </span>
                )}
                {selectedOption === option.id && (
                  <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedOption === 'custom' && (
          <GlassCard className="p-4 mb-6">
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="glass-input w-full"
            />
          </GlassCard>
        )}

        {error && (
          <p className="mt-4 text-sm text-error text-center">{error}</p>
        )}

        <div className="flex gap-3 mt-8 w-full">
          <GlassButton variant="secondary" onClick={onBack} className="flex-1 py-4 min-w-0" disabled={loading}>
            Back
          </GlassButton>
          <GlassButton
            onClick={handleContinue}
            disabled={!selectedOption || (selectedOption === 'custom' && !customDate) || loading}
            className="flex-1 py-4 min-w-0"
          >
            {loading ? 'Saving...' : 'Continue'}
          </GlassButton>
        </div>
      </div>
    </>
  )
}

