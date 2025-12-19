import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { sessionService, programService } from '../../services'
import { analyticsService } from '../../services/analytics.service'

interface ReminderSettingsProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export default function ReminderSettings({ step, totalSteps, onNext, onBack }: ReminderSettingsProps) {
  const { user, updateUserProfile } = useApp()
  const navigate = useNavigate()
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFinish = async () => {
    if (!user?.id) {
      setError('User not found. Please login again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update profile with reminder settings
      const profileResult = await profileService.updateProfile(user.id, {
        enable_reminders: remindersEnabled,
        daily_reminder_time: reminderTime,
      })

      if (!profileResult.success) {
        setError(profileResult.error || 'Failed to save settings')
        setLoading(false)
        return
      }

      // Get or create default program
      const programResult = await programService.getActiveProgram('en')
      if (!programResult.success || !programResult.data) {
        setError('Program not found. Please contact support.')
        setLoading(false)
        return
      }

      // Create initial user session
      const sessionResult = await sessionService.createOrGetSession(user.id, programResult.data.id!)
      if (!sessionResult.success) {
        setError('Failed to create session. Please try again.')
        setLoading(false)
        return
      }

      // Track analytics
      await analyticsService.trackOnboardingCompleted(user.id)

      // Update context with profile data
      if (updateUserProfile && profileResult.data) {
        await updateUserProfile(profileResult.data)
      }

      // Navigate to home
      navigate('/home')
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
          Set your daily reminder
        </h1>
        <p className="text-text-primary/70 mb-8">
          We'll help you stay on track with daily check-ins
        </p>

        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-brand-primary" />
              <div>
                <div className="font-medium text-text-primary">Enable daily reminders</div>
                <div className="text-sm text-text-primary/70">
                  Get notified to check in with your progress
                </div>
              </div>
            </div>
            <button
              onClick={() => setRemindersEnabled(!remindersEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                remindersEnabled ? 'bg-brand-primary' : 'bg-text-primary/30'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  remindersEnabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {remindersEnabled && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reminder time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="glass-input w-full"
              />
              <p className="mt-2 text-sm text-text-primary/70">
                We'll remind you at {reminderTime} every day
              </p>
            </div>
          )}
        </GlassCard>

        {error && (
          <p className="mt-4 text-sm text-error text-center">{error}</p>
        )}

        <div className="flex gap-3 mt-8 w-full">
          <GlassButton variant="secondary" onClick={onBack} className="flex-1 py-4 min-w-0" disabled={loading}>
            Back
          </GlassButton>
          <GlassButton onClick={handleFinish} className="flex-1 py-4 min-w-0" disabled={loading}>
            {loading ? 'Finishing...' : 'Finish Setup'}
          </GlassButton>
        </div>
      </div>
    </>
  )
}

