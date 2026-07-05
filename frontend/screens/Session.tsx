import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import CompletionModal from '../components/CompletionModal'
import TextStepComponent from '../components/steps/TextStepComponent'
import MCQStepComponent from '../components/steps/MCQStepComponent'
import OpenQuestionComponent from '../components/steps/OpenQuestionComponent'
import ExerciseComponent from '../components/steps/ExerciseComponent'
import VideoPlayerComponent from '../components/steps/VideoPlayerComponent'
import { useApp } from '../context/AppContext'
import { programService } from '../services/program.service'
import { sessionService } from '../services/session.service'
import { achievementService } from '../services/achievement.service'
import { analyticsService } from '../services/analytics.service'
import { aiService } from '../services/ai.service'
import { behaviorTracker } from '../services/behavior-tracker.service'
import { behaviorProfileService } from '../services/behavior-profile.service'
import { beliefService } from '../services/belief.service'
import { BeliefAssessment } from '../components/BeliefAssessment'
import { useTouchSwipe } from '../hooks/useTouchSwipe'
import { StepType, SessionStatus } from '../types/enums'
import { ProgramDay, Step, SessionProgress, PersonalizedContent } from '../types/models'

export default function Session() {
  const { dayId } = useParams<{ dayId: string }>()
  const navigate = useNavigate()
  const { user, refreshProgress, isPremium } = useApp()
  const [programDay, setProgramDay] = useState<ProgramDay | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [, setSessionProgress] = useState<SessionProgress | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent | null>(null)
  const [showBeliefAssessment, setShowBeliefAssessment] = useState(false)
  const [beliefDay, setBeliefDay] = useState<0 | 15 | 30>(15)

  const swipeHandlers = useTouchSwipe(
    () => { if (currentStepIndex < steps.length - 1) moveToNextStep() },
    () => { if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1) }
  )

  useEffect(() => {
    if (user?.id && dayId) {
      loadSession()
      behaviorTracker.init(user.id)
    }
  }, [user?.id, dayId])

  // Track step drop-off when user leaves mid-session
  useEffect(() => {
    return () => {
      if (user?.id && programDay && currentStepIndex < steps.length - 1 && steps.length > 0) {
        behaviorTracker.trackStepDropped(
          programDay.day_number || 1,
          currentStepIndex,
          steps[currentStepIndex]?.type || 'unknown'
        )
      }
    }
  }, [currentStepIndex])

  const loadSession = async () => {
    if (!user?.id || !dayId) return

    setIsLoading(true)
    try {
      // Fetch program day, steps, and session progress in parallel to maximize speed
      const [dayResult, stepsResult, progressResult] = await Promise.all([
        programService.getProgramDayById(dayId),
        programService.getSteps(dayId),
        sessionService.getSessionProgress(user.id, dayId)
      ])

      if (!dayResult.success || !dayResult.data) {
        console.error('Failed to fetch program day:', dayResult.error)
        navigate('/sessions')
        return
      }
      setProgramDay(dayResult.data)

      if (stepsResult.success && stepsResult.data) {
        setSteps(stepsResult.data.sort((a, b) => a.order - b.order))
      } else {
        console.error('Failed to fetch steps:', stepsResult.error)
      }

      const dayNum = dayResult.data.day_number || 1

      // Freemium lock: Days 2-30 require premium
      if (dayNum > 1 && !isPremium) {
        navigate('/paywall')
        return
      }

      // Gate Day 15 and 30 behind belief assessment
      if ((dayNum === 15 || dayNum === 30) && user?.id) {
        const hasAssessment = await beliefService.hasAssessmentForDay(user.id, dayNum)
        if (!hasAssessment) {
          setBeliefDay(dayNum as 15 | 30)
          setShowBeliefAssessment(true)
        }
      }

      // AI Personalization context loading (non-blocking background task)
      if (user?.id) {
        aiService.getPersonalizedSessionContent(user.id, dayNum)
          .then(content => { if (content) setPersonalizedContent(content) })
          .catch(() => { /* graceful fallback */ })
      }

      // Handle session progress state
      let progress: SessionProgress | null = null
      if (progressResult.success) {
        progress = progressResult.data || null
        if (progress && progress.id) {
          setSessionProgress(progress)
          setCurrentStepIndex(progress.last_step_index || 0)
          
          if (progress.status === SessionStatus.NOT_STARTED) {
            // Update to IN_PROGRESS directly
            const updateResult = await sessionService.upsertSessionProgress(user.id, dayId, {
              status: SessionStatus.IN_PROGRESS,
            })
            if (updateResult.success && updateResult.data) {
              setSessionProgress(updateResult.data)
            }
            analyticsService.trackSessionStarted(user.id, dayNum).catch(() => {})
          }
          
          // Set start time for tracking
          setSessionStartTime(new Date())
        } else {
          // Create new session progress directly as IN_PROGRESS
          const newProgressResult = await sessionService.upsertSessionProgress(user.id, dayId, {
            status: SessionStatus.IN_PROGRESS,
            last_step_index: 0,
          })
          if (newProgressResult.success && newProgressResult.data) {
            setSessionProgress(newProgressResult.data)
          }
          setSessionStartTime(new Date())
          analyticsService.trackSessionStarted(user.id, dayNum).catch(() => {})
        }
      } else {
        console.error('Failed to fetch session progress:', progressResult.error)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const moveToNextStep = async (stepResponse?: any) => {
    if (!user?.id || !dayId || !steps[currentStepIndex]) return

    // Ensure session is started and start time is set
    if (!sessionStartTime) {
      const startTime = new Date()
      setSessionStartTime(startTime)
      // Also ensure session progress is marked as in progress
      try {
        await sessionService.upsertSessionProgress(user.id, dayId, {
          status: SessionStatus.IN_PROGRESS,
          last_step_index: currentStepIndex,
        })
      } catch (error) {
        console.warn('Failed to update session progress:', error)
      }
    }

    setIsSaving(true)
    try {
      const currentStep = steps[currentStepIndex]

      // Save step response if provided
      if (stepResponse) {
        await sessionService.saveStepResponse(user.id, currentStep.id!, stepResponse)
      }

      // Check if this is the last step
      if (currentStepIndex === steps.length - 1) {
        // Complete session
        await completeSession()
      } else {
        // Move to next step
        const nextIndex = currentStepIndex + 1
        setCurrentStepIndex(nextIndex)

        // Update session progress
        await sessionService.upsertSessionProgress(user.id, dayId, {
          last_step_index: nextIndex,
        })
      }
    } catch (error) {
      console.error('Failed to move to next step:', error)
      alert('Failed to move to next step. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const completeSession = async () => {
    if (!user?.id || !dayId) {
      console.warn('Cannot complete session: missing required data', { user: user?.id, dayId })
      return
    }

    setIsSaving(true)
    try {
      const endTime = new Date()
      // Use sessionStartTime if available, otherwise use current time (fallback)
      // This handles cases where sessionStartTime wasn't properly set
      const startTime = sessionStartTime || new Date()
      const timeSpentMinutes = Math.max(1, Math.round(
        (endTime.getTime() - startTime.getTime()) / 1000 / 60
      ))

      // Complete session
      const result = await sessionService.completeSession(user.id, dayId, timeSpentMinutes)

      if (result.success) {
        // Check achievements
        await achievementService.checkAndUnlock(user.id)

        // Refresh progress
        await refreshProgress()

        // Track analytics
        await analyticsService.trackSessionCompleted(
          user.id,
          programDay?.day_number || 1,
          timeSpentMinutes
        )

        // Recompute behavioral profile — non-blocking
        behaviorProfileService.computeAndSave(user.id).catch(() => {})

        // Show completion modal
        setShowCompletionModal(true)
      } else {
        console.error('Failed to complete session:', result.error)
      }
    } catch (error) {
      console.error('Failed to complete session:', error)
      alert('Failed to complete session. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStepResponse = (response: any) => {
    moveToNextStep(response)
  }

  const renderStepComponent = () => {
    if (!steps[currentStepIndex]) return null

    const step = steps[currentStepIndex]

    switch (step.type) {
      case StepType.TEXT:
        return <TextStepComponent step={step} onNext={() => moveToNextStep()} />

      case StepType.QUESTION_MCQ:
        return <MCQStepComponent step={step} onNext={handleStepResponse} />

      case StepType.QUESTION_OPEN:
        return <OpenQuestionComponent step={step} onNext={handleStepResponse} />

      case StepType.EXERCISE:
        return <ExerciseComponent step={step} onNext={() => moveToNextStep()} />

      case StepType.VIDEO:
        return <VideoPlayerComponent step={step} onNext={() => moveToNextStep()} />

      default:
        return <div className="text-text-primary">Unknown step type</div>
    }
  }

  if (showBeliefAssessment && user?.id) {
    return (
      <div className="min-h-screen min-h-[100dvh] pb-20">
        <TopNavigation left="back" center="Belief Check-in" right="" />
        <div className="app-container px-3 sm:px-4 pt-6">
          <BeliefAssessment
            assessmentDay={beliefDay}
            userId={user.id}
            onComplete={() => setShowBeliefAssessment(false)}
          />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] pb-20">
        <TopNavigation left="back" center="Loading..." right="" />
        <div className="app-container px-3 sm:px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <img
              src="/mascot.png"
              alt="Loading..."
              className="w-32 h-32 sm:w-48 sm:h-48 object-contain animate-pulse"
            />
            <p className="text-text-primary/70 text-sm sm:text-base font-medium">Loading session...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!programDay || steps.length === 0) {
    return (
      <div className="min-h-screen min-h-[100dvh] pb-20">
        <TopNavigation left="back" center="Session" right="" />
        <div className="app-container px-3 sm:px-4 pt-6">
          <GlassCard className="p-6 text-center">
            <p className="text-text-primary">Session not found</p>
            <GlassButton onClick={() => navigate('/sessions')} className="mt-4">
              Back to Sessions
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    )
  }

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <div className="min-h-screen min-h-[100dvh] pb-24">
      <TopNavigation
        left="back"
        center={`Day ${programDay.day_number}: Step ${currentStepIndex + 1}/${steps.length}`}
        right=""
      />

      <div className="app-container px-3 sm:px-4 pt-4 sm:pt-6 pb-8" {...swipeHandlers}>
        {/* Progress bar */}
        <div className="mb-4 sm:mb-6">
          <div className="h-1.5 sm:h-2 glass rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* AI Personalized Intro (Day 6+, first step only) */}
        {personalizedContent?.session_intro && currentStepIndex === 0 && (
          <GlassCard className="p-5 mb-4 bg-brand-primary/5 border-brand-primary/10">
            <p className="text-text-primary/90 text-sm leading-relaxed italic">
              {personalizedContent.session_intro}
            </p>
          </GlassCard>
        )}

        {/* Step content */}
        <GlassCard className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-1">
              {programDay.title}
            </h2>
            {programDay.subtitle && (
              <p className="text-xs sm:text-sm text-text-primary/60 mb-2 sm:mb-3">{programDay.subtitle}</p>
            )}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full glass-subtle">
              <span className="text-[11px] sm:text-xs font-medium text-text-primary/70">
                {currentStep.type === StepType.TEXT && 'Reading'}
                {currentStep.type === StepType.QUESTION_MCQ && 'Quiz'}
                {currentStep.type === StepType.QUESTION_OPEN && 'Reflection'}
                {currentStep.type === StepType.EXERCISE && 'Exercise'}
                {currentStep.type === StepType.VIDEO && 'Video'}
              </span>
            </div>
          </div>

          {/* AI Exercise Motivation (before exercise steps) */}
          {personalizedContent?.exercise_motivation && currentStep.type === StepType.EXERCISE && (
            <p className="text-text-primary/80 text-sm mb-3 italic">
              {personalizedContent.exercise_motivation}
            </p>
          )}

          <div className="mt-4">
            {renderStepComponent()}
          </div>
        </GlassCard>

        {/* AI Closing Reflection (last step only) */}
        {personalizedContent?.closing_reflection && isLastStep && (
          <GlassCard className="p-5 mb-4 bg-brand-accent/5 border-brand-accent/10">
            <p className="text-text-primary/90 text-sm leading-relaxed italic">
              {personalizedContent.closing_reflection}
            </p>
            {personalizedContent.journal_prompt && (
              <p className="text-brand-accent text-xs mt-3 font-medium">
                Journal prompt: {personalizedContent.journal_prompt}
              </p>
            )}
          </GlassCard>
        )}

        {/* Navigation */}
        <div className="flex gap-3 w-full">
          <GlassButton
            variant="secondary"
            onClick={() => {
              if (currentStepIndex > 0) {
                setCurrentStepIndex(currentStepIndex - 1)
              } else {
                navigate('/sessions')
              }
            }}
            className="flex-1 py-4 flex items-center justify-center min-w-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </GlassButton>
          {!isLastStep && (
            <GlassButton
              onClick={() => moveToNextStep()}
              disabled={isSaving}
              className="flex-1 py-4 flex items-center justify-center min-w-0"
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                  Next <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </GlassButton>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        dayNumber={programDay.day_number || 1}
        timeSpentMinutes={
          sessionStartTime
            ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60)
            : 0
        }
        stepsCompleted={steps.length}
        hasNextDay={(programDay.day_number || 0) < 30}
        onNextDay={() => {
          setShowCompletionModal(false)
          navigate('/sessions')
        }}
      />
    </div>
  )
}
