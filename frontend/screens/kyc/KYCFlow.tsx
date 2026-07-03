import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PersonalInfo from './PersonalInfo'
import AddictionDetails from './AddictionDetails'
import TriggerSelection from './TriggerSelection'
import EmotionalStates from './EmotionalStates'
import FearIndex from './FearIndex'
import Motivation from './Motivation'
import ReminderSettings from './ReminderSettings'
import ArchetypeReveal from './ArchetypeReveal'
import InsightInterstitial from '../../components/InsightInterstitial'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { assignQuitArchetype, getArchetypeInfo } from '../../utils/archetypeAssignment'
import { CravingTrigger, EmotionalState, QuitArchetype } from '../../types/enums'

export default function KYCFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showInsight, setShowInsight] = useState(false)
  const [showArchetypeReveal, setShowArchetypeReveal] = useState(false)
  const [assignedArchetype, setAssignedArchetype] = useState<QuitArchetype | null>(null)
  const [insightData, setInsightData] = useState({ dailyConsumption: 10, monthsUsing: 24 })
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
    // After step 2 (AddictionDetails), show insight interstitial
    if (currentStep === 2) {
      // Fetch saved data for interstitial calculations
      if (user?.id) {
        try {
          const result = await profileService.getByUserId(user.id)
          if (result.success && result.data) {
            setInsightData({
              dailyConsumption: result.data.daily_consumption || 10,
              monthsUsing: result.data.how_long_using || 24,
            })
          }
        } catch { /* use defaults */ }
      }
      setShowInsight(true)
      return
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step - assign archetype and show reveal
      const archetype = await assignArchetype()
      if (archetype) {
        setAssignedArchetype(archetype)
        setShowArchetypeReveal(true)
      } else {
        navigate('/home')
      }
    }
  }

  const assignArchetype = async (): Promise<QuitArchetype | null> => {
    if (!user?.id) return null

    try {
      const profileResult = await profileService.getByUserId(user.id)

      if (profileResult.success && profileResult.data) {
        const profile = profileResult.data
        const triggers = (profile.smoking_triggers || []) as CravingTrigger[]
        const emotionalStates = (profile.emotional_states || []) as EmotionalState[]

        const archetype = assignQuitArchetype(triggers, emotionalStates)

        await profileService.upsert(user.id, {
          quit_archetype: archetype,
        })

        return archetype
      }
    } catch (error) {
      console.error('Failed to assign archetype:', error)
    }
    return null
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/signup')
    }
  }

  // Show insight interstitial between steps 2 and 3
  if (showInsight) {
    return (
      <InsightInterstitial
        dailyConsumption={insightData.dailyConsumption}
        monthsUsing={insightData.monthsUsing}
        onContinue={() => {
          setShowInsight(false)
          setCurrentStep(3)
        }}
      />
    )
  }

  // Show archetype reveal after final step
  if (showArchetypeReveal && assignedArchetype) {
    const info = getArchetypeInfo(assignedArchetype)
    return (
      <ArchetypeReveal
        archetype={assignedArchetype}
        name={info.name}
        description={info.description}
        icon={info.icon}
        characteristics={info.characteristics}
        onContinue={() => navigate('/home')}
      />
    )
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

