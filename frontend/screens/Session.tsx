import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle, Lock } from 'lucide-react'
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
import { StepType, SessionStatus } from '../types/enums'
import { ProgramDay, Step, SessionProgress } from '../types/models'

export default function Session() {
  const { dayId } = useParams<{ dayId: string }>()
  const navigate = useNavigate()
  const { user, refreshProgress } = useApp()
  const [programDay, setProgramDay] = useState<ProgramDay | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)

  useEffect(() => {
    if (user?.id && dayId) {
      loadSession()
    }
  }, [user?.id, dayId])

  const loadSession = async () => {
    if (!user?.id || !dayId) return

    setIsLoading(true)
    try {
      // Fetch program day by ID
      const dayResult = await programService.getProgramDayById(dayId)
      if (!dayResult.success || !dayResult.data) {
        console.error('Failed to fetch program day:', dayResult.error)
        navigate('/sessions')
        return
      }
      setProgramDay(dayResult.data)

      // Fetch steps for this day
      const stepsResult = await programService.getSteps(dayId)
      if (stepsResult.success && stepsResult.data) {
        setSteps(stepsResult.data.sort((a, b) => a.order - b.order))
      } else {
        console.error('Failed to fetch steps:', stepsResult.error)
      }

      // Fetch or create session progress
      const progressResult = await sessionService.getSessionProgress(user.id, dayId)
      let progress: SessionProgress | null = null
      
      if (progressResult.success) {
        progress = progressResult.data
        if (progress && progress.id) {
          setSessionProgress(progress)
          // Resume from last step
          setCurrentStepIndex(progress.last_step_index || 0)
        } else {
          // Create new session progress
          const newProgressResult = await sessionService.upsertSessionProgress(user.id, dayId, {
            status: SessionStatus.NOT_STARTED,
            last_step_index: 0,
          })
          if (newProgressResult.success && newProgressResult.data) {
            progress = newProgressResult.data
            setSessionProgress(progress)
          } else {
            console.error('Failed to create session progress:', newProgressResult.error)
          }
        }
      } else {
        console.error('Failed to fetch session progress:', progressResult.error)
      }

      // If not started, mark as in progress (programDay is already set at this point)
      if (!progress || progress.status === SessionStatus.NOT_STARTED) {
        await startSession()
      } else if (progress.status === SessionStatus.IN_PROGRESS) {
        // Session already in progress, set start time if not already set
        // Use current time as fallback (approximate)
        if (!sessionStartTime) {
          setSessionStartTime(new Date())
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startSession = async () => {
    if (!user?.id || !dayId) return

    try {
      const dayNumber = programDay?.day_number || 1
      const startTime = new Date()
      
      // Set start time immediately to ensure it's available
      setSessionStartTime(startTime)
      
      const result = await sessionService.upsertSessionProgress(user.id, dayId, {
        status: SessionStatus.IN_PROGRESS,
        last_step_index: currentStepIndex,
      })

      if (result.success && result.data) {
        setSessionProgress(result.data)
        // Track analytics
        await analyticsService.trackSessionStarted(user.id, dayNumber)
      } else {
        // If session creation failed, still keep the start time for completion
        console.warn('Session progress update failed, but keeping start time')
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      // Even if there's an error, set start time as fallback
      if (!sessionStartTime) {
        setSessionStartTime(new Date())
      }
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

        // Show completion modal - ensure it's shown
        console.log('Showing completion modal for day', programDay?.day_number)
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

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <TopNavigation left="back" center="Loading..." right="" />
        <div className="max-w-md mx-auto px-4 pt-6">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!programDay || steps.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <TopNavigation left="back" center="Session" right="" />
        <div className="max-w-md mx-auto px-4 pt-6">
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
    <div className="min-h-screen pb-24">
      <TopNavigation
        left="back"
        center={`Day ${programDay.day_number}: Step ${currentStepIndex + 1}/${steps.length}`}
        right=""
      />

      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 glass rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step content */}
        <GlassCard className="p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {programDay.title}
            </h2>
            {programDay.subtitle && (
              <p className="text-text-primary/70 mb-4">{programDay.subtitle}</p>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle mb-2">
              <span className="text-xs font-medium text-text-primary/70">
                {currentStep.type === StepType.TEXT && '📄 Reading'}
                {currentStep.type === StepType.QUESTION_MCQ && '❓ Multiple Choice'}
                {currentStep.type === StepType.QUESTION_OPEN && '✍️ Open Question'}
                {currentStep.type === StepType.EXERCISE && '🧘 Exercise'}
                {currentStep.type === StepType.VIDEO && '🎥 Video'}
              </span>
            </div>
          </div>

          <div className="mt-4">
            {renderStepComponent()}
          </div>
        </GlassCard>

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
        hasNextDay={(programDay.day_number || 0) < 10}
        onNextDay={() => {
          setShowCompletionModal(false)
          navigate('/sessions')
        }}
      />
    </div>
  )
}
