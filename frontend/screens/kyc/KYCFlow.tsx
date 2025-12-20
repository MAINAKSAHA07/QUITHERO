import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PersonalInfo from './PersonalInfo'
import AddictionDetails from './AddictionDetails'
import TriggerSelection from './TriggerSelection'
import EmotionalStates from './EmotionalStates'
import FearIndex from './FearIndex'
import Motivation from './Motivation'
import ReminderSettings from './ReminderSettings'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { assignQuitArchetype } from '../../utils/archetypeAssignment'
import { CravingTrigger, EmotionalState } from '../../types/enums'

export default function KYCFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const navigate = useNavigate()
  const { user } = useApp()

  const steps = [
    { component: PersonalInfo, title: 'Personal Information' },
    { component: AddictionDetails, title: 'Addiction Details' },
    { component: TriggerSelection, title: 'Smoking Triggers' },
    { component: EmotionalStates, title: 'Emotional States' },
    { component: FearIndex, title: 'Fear Assessment' },
    { component: Motivation, title: 'Motivation' },
    { component: ReminderSettings, title: 'Reminders' },
  ]

  const handleNext = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step - assign archetype before completing onboarding
      await assignArchetype()
      navigate('/home')
    }
  }

  const assignArchetype = async () => {
    if (!user?.id) return

    try {
      // Fetch current profile to get triggers and emotional states
      const profileResult = await profileService.getByUserId(user.id)

      if (profileResult.success && profileResult.data) {
        const profile = profileResult.data
        const triggers = (profile.smoking_triggers || []) as CravingTrigger[]
        const emotionalStates = (profile.emotional_states || []) as EmotionalState[]

        // Assign archetype based on collected data
        const archetype = assignQuitArchetype(triggers, emotionalStates)

        // Save archetype to profile
        await profileService.upsert(user.id, {
          quit_archetype: archetype,
        })

        console.log('Quit archetype assigned:', archetype)
      }
    } catch (error) {
      console.error('Failed to assign archetype:', error)
      // Don't block onboarding completion if archetype assignment fails
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/signup')
    }
  }

  const CurrentStepComponent = steps[currentStep - 1].component

  return (
    <div className="min-h-screen pb-20">
      <CurrentStepComponent
        step={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  )
}

