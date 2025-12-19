import { useState } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { Gender, Language } from '../../types/enums'

interface PersonalInfoProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export default function PersonalInfo({ step, totalSteps, onNext, onBack }: PersonalInfoProps) {
  const { user, upsertProfile } = useApp()
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleContinue = async () => {
    if (!age || !gender) {
      setError('Please fill in all required fields')
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
        age: parseInt(age),
        gender: gender as Gender,
        language: Language.EN, // Default to English for now
        ...(location && { location }),
      })

      if (result.success) {
        // Update context
        if (upsertProfile) {
          await upsertProfile(result.data!)
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
        {/* Progress bar */}
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
          Tell us about yourself
        </h1>
        <p className="text-text-primary/70 mb-8">
          This helps us personalize your experience
        </p>

        <GlassCard className="p-6 space-y-4">
          <GlassInput
            type="number"
            label="Age"
            placeholder="Enter your age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            icon={<Calendar className="w-5 h-5" />}
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Male', value: Gender.MALE },
                { label: 'Female', value: Gender.FEMALE },
                { label: 'Other', value: Gender.OTHER },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGender(option.value)}
                  className={`glass p-3 rounded-xl text-center transition-all ${
                    gender === option.value
                      ? 'ring-2 ring-brand-primary shadow-glow'
                      : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <GlassInput
            type="text"
            label="Location (Optional)"
            placeholder="City, Country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            icon={<MapPin className="w-5 h-5" />}
          />
        </GlassCard>

        <div className="flex gap-3 mt-8 w-full">
          <GlassButton variant="secondary" onClick={onBack} className="flex-1 py-4 min-w-0" disabled={loading}>
            Back
          </GlassButton>
          <GlassButton
            onClick={handleContinue}
            className="flex-1 py-4 min-w-0"
            disabled={loading || !age || !gender}
          >
            {loading ? 'Saving...' : 'Continue'}
          </GlassButton>
        </div>

        {error && (
          <p className="mt-4 text-sm text-error text-center">{error}</p>
        )}

        <button
          onClick={onNext}
          className="mt-4 text-center w-full text-text-primary/70 text-sm hover:text-text-primary"
        >
          Skip for now
        </button>
      </div>
    </>
  )
}

