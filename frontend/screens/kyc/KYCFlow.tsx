import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PersonalInfo from './PersonalInfo'
import AddictionDetails from './AddictionDetails'
import QuitDateSelection from './QuitDateSelection'
import Motivation from './Motivation'
import ReminderSettings from './ReminderSettings'

export default function KYCFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const navigate = useNavigate()

  const steps = [
    { component: PersonalInfo, title: 'Personal Information' },
    { component: AddictionDetails, title: 'Addiction Details' },
    { component: QuitDateSelection, title: 'Quit Date' },
    { component: Motivation, title: 'Motivation' },
    { component: ReminderSettings, title: 'Reminders' },
  ]

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/home')
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

