import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationOptIn from './NotificationOptIn'
import KYCQuestionScreen from './KYCQuestionScreen'
import { kycQuestions } from './kycQuestions'
import InsightSequence from './InsightSequence'
import ArchetypeReveal from './ArchetypeReveal'
import { BeliefAssessment } from '../../components/BeliefAssessment'
import { PersonalizationLoader } from '../../components/PersonalizationLoader'
import { useApp } from '../../context/AppContext'
import { profileService } from '../../services/profile.service'
import { assignDetailedQuitArchetype, getArchetypeInfo } from '../../utils/archetypeAssignment'
import { Gender, Language, CravingTrigger, EmotionalState, QuitArchetype } from '../../types/enums'

export default function KYCFlow() {
  const [currentStep, setCurrentStep] = useState<
    'optin' | 'questions_pre' | 'insight' | 'questions_post' | 'reveal' | 'belief' | 'loader'
  >('optin')

  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    // Load progress from localStorage if available
    try {
      const saved = localStorage.getItem('kyc_answers')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [assignedArchetype, setAssignedArchetype] = useState<QuitArchetype | null>(null)
  const navigate = useNavigate()
  const { user, updateUserProfile } = useApp()

  // Save answers to localStorage dynamically
  useEffect(() => {
    try {
      localStorage.setItem('kyc_answers', JSON.stringify(answers))
    } catch (e) {
      console.error('Failed to save answers to localStorage:', e)
    }
  }, [answers])

  // Helper to map values to DB formats and enum types
  const mapAnswersToProfile = (rawAnswers: Record<string, any>) => {
    // Gender mapping
    let mappedGender = Gender.PREFER_NOT_TO_SAY
    if (rawAnswers.gender === 'Male') mappedGender = Gender.MALE
    else if (rawAnswers.gender === 'Female') mappedGender = Gender.FEMALE
    else if (rawAnswers.gender === 'Non-binary') mappedGender = Gender.OTHER

    // Language mapping
    let mappedLang = Language.EN
    const langMap: Record<string, Language> = {
      'English': Language.EN,
      'Hindi': Language.HI,
      'Marathi': Language.MR,
      'Gujarati': Language.GU,
      'Español': Language.ES,
      'Français': Language.FR,
      'Deutsch': Language.DE,
      'Italiano': Language.IT,
      '中文': Language.ZH,
    }
    if (rawAnswers.language && langMap[rawAnswers.language]) {
      mappedLang = langMap[rawAnswers.language]
    }

    // Nicotine Forms mapping
    const rawNicotineForms = rawAnswers.nicotine_forms || []
    const nicotineForms = rawNicotineForms.map((f: string) => f.toLowerCase())

    // Months using nicotine mapping
    let monthsUsing = 24
    if (rawAnswers.how_long_using === 'Under 1 year') monthsUsing = 6
    else if (rawAnswers.how_long_using === '1–3 years') monthsUsing = 24
    else if (rawAnswers.how_long_using === '3–5 years') monthsUsing = 48
    else if (rawAnswers.how_long_using === '5–10 years') monthsUsing = 90
    else if (rawAnswers.how_long_using === '10+ years') monthsUsing = 180

    // Smoking Triggers mapping based on primary trigger choice
    const triggers: CravingTrigger[] = []
    const pTrigger = rawAnswers.primary_trigger
    if (pTrigger === 'Stress & anxiety') triggers.push(CravingTrigger.STRESS)
    else if (pTrigger === 'Boredom / driving') triggers.push(CravingTrigger.BOREDOM)
    else if (pTrigger === 'Social pressure') triggers.push(CravingTrigger.SOCIAL)
    else if (pTrigger === 'Finishing meals') triggers.push(CravingTrigger.HABIT)
    else triggers.push(CravingTrigger.OTHER)

    // Emotional States mapping
    const statesMap: Record<string, EmotionalState> = {
      'Stressed': EmotionalState.STRESSED,
      'Anxious': EmotionalState.ANXIOUS,
      'Bored': EmotionalState.BORED,
      'Lonely': EmotionalState.LONELY,
      'Sad': EmotionalState.SAD_STATE,
      'Angry': EmotionalState.ANGRY,
      'Happy': EmotionalState.HAPPY,
      'Excited': EmotionalState.EXCITED,
    }
    const rawEmotionalStates = rawAnswers.emotional_states || []
    const emotionalStates = rawEmotionalStates
      .map((s: string) => statesMap[s])
      .filter(Boolean)

    return {
      onboarding_name: rawAnswers.onboarding_name || '',
      country: rawAnswers.country || 'IN',
      age: Number(rawAnswers.age) || 30,
      gender: mappedGender,
      language: mappedLang,
      nicotine_forms: nicotineForms,
      how_long_using: monthsUsing,
      daily_consumption: Number(rawAnswers.daily_consumption) || 10,
      pack_cost: Number(rawAnswers.pack_cost) || 300,
      minutes_per_cigarette: Number(rawAnswers.minutes_per_cigarette) || 7,
      started_age_range: rawAnswers.started_age_range || '18–21',
      first_use_after_waking: rawAnswers.first_use_after_waking || 'Within 30 minutes',
      smoking_times: rawAnswers.smoking_times || [],
      smoking_environments: rawAnswers.smoking_environments || [],
      primary_trigger: rawAnswers.primary_trigger || 'Stress & anxiety',
      craving_peak_time: rawAnswers.craving_peak_time || 'Evenings',
      smoking_triggers: triggers,
      emotional_states: emotionalStates,
      daily_stress_level: rawAnswers.daily_stress_level || 'Moderate stress',
      anxiety_social_pattern: rawAnswers.anxiety_social_pattern || 'Both equally',
      guilt_frequency: rawAnswers.guilt_frequency || 'Occasionally',
      tried_quitting_before: rawAnswers.tried_quitting_before || 'No, this is my first time',
      previous_attempt_difficulty: rawAnswers.previous_attempt_difficulty || [],
      quit_attempt_count: rawAnswers.quit_attempt_count || 'Never, this is my first attempt',
      past_quit_tools: rawAnswers.past_quit_tools || [],
      primary_motivation: rawAnswers.primary_motivation || 'Physical health / breathing quality',
      motivations: rawAnswers.motivations || [],
      priority_goal: rawAnswers.priority_goal || 'Clear lungs & better stamina',
      quit_goal_style: rawAnswers.quit_goal_style || 'I want to quit completely',
      quit_confidence: rawAnswers.quit_confidence || 'Moderately confident',
      quit_reason: rawAnswers.quit_reason || '',
      fear_index: Number(rawAnswers.fear_index) || 5,
      cravings_worry: rawAnswers.cravings_worry || 'Slightly worried',
      relapse_worry: rawAnswers.relapse_worry || 'Slightly worried',
      withdrawal_worry: rawAnswers.withdrawal_worry || 'Slightly worried',
      household_smokers: rawAnswers.household_smokers || 'No, smoke-free household',
      occupation_style: rawAnswers.occupation_style || 'Other',
      reminder_frequency: rawAnswers.reminder_frequency || 'Yes, morning and evening',
      support_preference: rawAnswers.support_preference || 'Balanced: standard daily modules only',
      checkin_time_preference: rawAnswers.checkin_time_preference || 'Evening: 6 PM to 8 PM',
      success_outcome: rawAnswers.success_outcome || '100% smoke-free',
      commitment_statement: rawAnswers.commitment_statement || 'I commit to my smoke-free future',
      enable_reminders: !!rawAnswers.enable_reminders,
    }
  }

  // Group boundary checker helper
  const isPreInsightIndex = (index: number) => {
    // Group A, B, C questions end at index 15
    return index <= 15
  }

  // Check showIf condition
  const shouldShowQuestion = (index: number) => {
    const q = kycQuestions[index]
    if (!q.showIf) return true
    const targetValue = answers[q.showIf.field]
    return q.showIf.values.includes(targetValue)
  }

  const handleNextQuestion = () => {
    let nextIndex = questionIndex + 1

    // Skip questions that don't match the showIf condition
    while (nextIndex < kycQuestions.length && !shouldShowQuestion(nextIndex)) {
      nextIndex++
    }

    if (isPreInsightIndex(questionIndex) && !isPreInsightIndex(nextIndex)) {
      // Trigger the intermediate Insight Sequence
      setCurrentStep('insight')
      setQuestionIndex(nextIndex)
    } else if (nextIndex < kycQuestions.length) {
      setQuestionIndex(nextIndex)
    } else {
      // Completed final question - assign archetype and show reveal
      handleAssignAndReveal()
    }
  }

  const handleBackQuestion = () => {
    let prevIndex = questionIndex - 1

    // Skip questions backward if they don't match the showIf condition
    while (prevIndex >= 0 && !shouldShowQuestion(prevIndex)) {
      prevIndex--
    }

    if (prevIndex < 0) {
      setCurrentStep('optin')
    } else if (!isPreInsightIndex(questionIndex) && isPreInsightIndex(prevIndex)) {
      // Scroll back to the Insight card before group D
      setCurrentStep('insight')
      setQuestionIndex(prevIndex)
    } else {
      setQuestionIndex(prevIndex)
    }
  }

  const handleAssignAndReveal = async () => {
    if (!user?.id) return
    try {
      const mappedProfile = mapAnswersToProfile(answers)
      const scoringResult = assignDetailedQuitArchetype(mappedProfile)

      // Save full profile and assigned archetype scores
      const result = await profileService.upsert(user.id, {
        ...mappedProfile,
        quit_archetype: scoringResult.assignedArchetype,
        secondary_quit_archetype: scoringResult.secondaryArchetype,
        readiness_score: scoringResult.readinessScore,
        relapse_risk_score: scoringResult.relapseRiskScore,
        support_intensity_score: scoringResult.supportIntensityScore,
        onboarding_completed_at: new Date().toISOString(),
        quit_date: new Date().toISOString(),
      })

      if (result.success && result.data) {
        if (updateUserProfile) {
          await updateUserProfile(result.data)
        }
        setAssignedArchetype(scoringResult.assignedArchetype)
        setCurrentStep('reveal')
      } else {
        console.error('❌ KYC profile upsert failed:', result.error)
        alert(`Failed to save profile: ${result.error}`)
      }
    } catch (e: any) {
      console.error('❌ Failed to complete onboarding assignment:', e)
      alert(`An error occurred: ${e.message}`)
    }
  }

  // Opt-in complete
  const handleOptIn = (enabled: boolean) => {
    setAnswers((prev) => ({ ...prev, enable_reminders: enabled }))
    setCurrentStep('questions_pre')
    setQuestionIndex(0)
  }

  // Clean up localStorage upon completion to prevent stale data
  const handleFinalRedirect = () => {
    try {
      localStorage.removeItem('kyc_answers')
    } catch {}
    navigate('/home')
  }

  // --- STATE RENDER MACHINES ---

  if (currentStep === 'optin') {
    return <NotificationOptIn onContinue={handleOptIn} />
  }

  if (currentStep === 'insight') {
    // Map raw answers for calculations
    const dailyConsumption = Number(answers.daily_consumption) || 10
    const packCost = Number(answers.pack_cost) || 300
    const minutesCig = Number(answers.minutes_per_cigarette) || 7
    
    let monthsUsing = 24
    if (answers.how_long_using === 'Under 1 year') monthsUsing = 6
    else if (answers.how_long_using === '1–3 years') monthsUsing = 24
    else if (answers.how_long_using === '3–5 years') monthsUsing = 48
    else if (answers.how_long_using === '5–10 years') monthsUsing = 90
    else if (answers.how_long_using === '10+ years') monthsUsing = 180

    return (
      <InsightSequence
        dailyConsumption={dailyConsumption}
        howLongUsing={monthsUsing}
        packCost={packCost}
        minutesPerCigarette={minutesCig}
        country={answers.country || 'IN'}
        onComplete={() => setCurrentStep('questions_post')}
      />
    )
  }

  if (currentStep === 'questions_pre' || currentStep === 'questions_post') {
    const activeQuestion = kycQuestions[questionIndex]
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <KYCQuestionScreen
            question={activeQuestion}
            value={answers[activeQuestion.id]}
            onChange={(val) => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: val }))}
            onNext={handleNextQuestion}
            onBack={handleBackQuestion}
            step={questionIndex + 1}
            totalSteps={kycQuestions.length}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  if (currentStep === 'reveal' && assignedArchetype) {
    const info = getArchetypeInfo(assignedArchetype)
    return (
      <ArchetypeReveal
        archetype={assignedArchetype}
        name={info.name}
        description={info.description}
        icon={info.icon}
        characteristics={info.characteristics}
        onContinue={() => setCurrentStep('belief')}
      />
    )
  }

  if (currentStep === 'belief' && user?.id) {
    return (
      <BeliefAssessment
        assessmentDay={0}
        userId={user.id}
        onComplete={() => setCurrentStep('loader')}
      />
    )
  }

  if (currentStep === 'loader') {
    return <PersonalizationLoader onComplete={handleFinalRedirect} />
  }

  return null
}
