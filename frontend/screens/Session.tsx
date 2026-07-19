import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import Mascot from '../components/Mascot'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import CompletionModal from '../components/CompletionModal'
import UpgradePrompt from '../components/UpgradePrompt'
import SessionStatCard from '../components/SessionStatCard'
import TriggerCheckMCQ from '../components/TriggerCheckMCQ'
import ComprehensionCheck from '../components/ComprehensionCheck'
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
import { sessionPersonalizationService } from '../services/session-personalization.service'
import { behaviorTracker } from '../services/behavior-tracker.service'
import { behaviorProfileService } from '../services/behavior-profile.service'
import { beliefService } from '../services/belief.service'
import { BeliefAssessment } from '../components/BeliefAssessment'
import { useTouchSwipe } from '../hooks/useTouchSwipe'
import { withStoredQuestion } from '../utils/stepResponse'
import { formatDayTitle } from '../utils/formatDayTitle'
import { needsDay2Upgrade } from '../utils/upgradePrompt'
import { useLiveTranslation } from '../hooks/useTranslation'
import { StepType, SessionStatus } from '../types/enums'
import { ProgramDay, Step, SessionProgress, PersonalizedContent } from '../types/models'
import {
  getSessionStatCard,
  injectTriggerBranchSteps,
  buildFallbackTriggerCheck,
  buildFallbackComprehensionCheck,
  buildFallbackPersonalizedContent,
  getComprehensionCheckpointIndex,
  isInjectedStep,
  getTriggerExerciseHint,
} from '../utils/sessionPersonalization'
import {
  clearSessionTimer,
  getSessionElapsedSeconds,
  elapsedToStorageMinutes,
  pauseSessionSegment,
  startSessionSegment,
} from '../utils/sessionDuration'
import KycRequiredModal from '../components/KycRequiredModal'
import { useKycGate } from '../hooks/useKycGate'

export default function Session() {
  const { dayId: dayIdParam, day: dayNumParam } = useParams<{ dayId?: string; day?: string }>()
  const navigate = useNavigate()
  const { user, userProfile, progressStats, refreshProgress, isPremium, currentSession, profileLoading, fetchCurrentSession } = useApp()
  const { showKycModal, setShowKycModal, kycComplete } = useKycGate()
  const [resolvedDayId, setResolvedDayId] = useState<string | null>(null)
  const dayId = resolvedDayId
  const routeDayKey = dayIdParam || dayNumParam
  const [programDay, setProgramDay] = useState<ProgramDay | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null)
  const [savedResponses, setSavedResponses] = useState<Record<string, unknown>>({})
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const savingLockRef = useRef(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completedDurationSeconds, setCompletedDurationSeconds] = useState(0)
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent | null>(null)
  const [showBeliefAssessment, setShowBeliefAssessment] = useState(false)
  const [beliefDay, setBeliefDay] = useState<0 | 15 | 30>(15)
  const [triggerCheckDone, setTriggerCheckDone] = useState(false)
  const [showTriggerCheck, setShowTriggerCheck] = useState(false)
  const [comprehensionCheckDone, setComprehensionCheckDone] = useState(false)
  const [showComprehensionCheck, setShowComprehensionCheck] = useState(false)
  const loadedDayRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollSessionToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  useEffect(() => {
    requestAnimationFrame(() => scrollSessionToTop())
  }, [currentStepIndex, showTriggerCheck, showComprehensionCheck])

  const beginSessionTimer = () => {
    if (!dayId) return
    startSessionSegment(dayId)
  }

  const dayNumber = programDay?.day_number || 1
  const dayTitle = useLiveTranslation(formatDayTitle(programDay?.title || ''))
  const daySubtitle = useLiveTranslation(programDay?.subtitle || '')
  const isReviewMode = sessionProgress?.status === SessionStatus.COMPLETED

  useEffect(() => {
    if (!dayId || isLoading || steps.length === 0 || isReviewMode) return
    startSessionSegment(dayId)
  }, [dayId, isLoading, steps.length, isReviewMode])

  useEffect(() => {
    if (!dayId || isReviewMode) return

    const onHide = () => pauseSessionSegment(dayId)
    const onShow = () => startSessionSegment(dayId)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onHide()
      else onShow()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onShow)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('pageshow', onShow)
      onHide()
    }
  }, [dayId, isReviewMode])

  const comprehensionCheckpoint = useMemo(
    () => getComprehensionCheckpointIndex(steps),
    [steps]
  )

  const statCard = useMemo(() => {
    if (!userProfile || !programDay?.day_number) return null
    return getSessionStatCard(userProfile, programDay.day_number, progressStats)
  }, [userProfile, programDay?.day_number, progressStats])

  const triggerExerciseHint = useMemo(() => {
    if (!userProfile || !programDay?.day_number) return undefined
    return getTriggerExerciseHint(userProfile, programDay.day_number)
  }, [userProfile, programDay?.day_number])

  const currentStep = steps[currentStepIndex]
  const stepRequiresInput =
    currentStep?.type === StepType.QUESTION_OPEN ||
    currentStep?.type === StepType.QUESTION_MCQ ||
    currentStep?.type === StepType.EXERCISE

  const canSwipeForward =
    !isSaving &&
    !showTriggerCheck &&
    !showComprehensionCheck &&
    currentStepIndex < steps.length - 1 &&
    !stepRequiresInput

  const canSwipeBack =
    !showTriggerCheck &&
    !showComprehensionCheck &&
    currentStepIndex > 0

  const swipeHandlers = useTouchSwipe(
    () => { if (canSwipeForward) moveToNextStep() },
    () => { if (canSwipeBack) setCurrentStepIndex(currentStepIndex - 1) }
  )

  useEffect(() => {
    if (!showComprehensionCheck) return
    if (personalizedContent?.comprehension_check) return
    setShowComprehensionCheck(false)
    setComprehensionCheckDone(true)
  }, [showComprehensionCheck, personalizedContent?.comprehension_check])

  useEffect(() => {
    let cancelled = false

    async function resolveDayRoute() {
      const routeKey = dayIdParam || dayNumParam
      if (!routeKey) {
        setResolvedDayId(null)
        return
      }

      // PocketBase record ids are alphanumeric; bare numbers are legacy day numbers
      if (!/^\d+$/.test(routeKey)) {
        setResolvedDayId(routeKey)
        return
      }

      const dayNumber = Number(routeKey)
      if (!user?.id || !currentSession?.program) {
        setResolvedDayId(null)
        return
      }

      const programId = typeof currentSession.program === 'string'
        ? currentSession.program
        : (currentSession.program as any)?.id || currentSession.program

      const dayResult = await programService.getProgramDayByNumber(programId, dayNumber)
      if (!cancelled) {
        setResolvedDayId(dayResult.success && dayResult.data?.id ? dayResult.data.id : null)
      }
    }

    resolveDayRoute()
    return () => { cancelled = true }
  }, [dayIdParam, dayNumParam, user?.id, currentSession?.program, currentSession?.id])

  useEffect(() => {
    if (!user?.id || !resolvedDayId || profileLoading) return
    if (!kycComplete) {
      setShowKycModal(true)
      setIsLoading(false)
      return
    }
    if (loadedDayRef.current === resolvedDayId) return
    loadedDayRef.current = resolvedDayId
    loadSession()
    behaviorTracker.init(user.id)
  }, [user?.id, resolvedDayId, profileLoading, kycComplete, setShowKycModal])

  useEffect(() => {
    loadedDayRef.current = null
  }, [routeDayKey])

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
    setTriggerCheckDone(false)
    setShowTriggerCheck(false)
    setComprehensionCheckDone(false)
    setShowComprehensionCheck(false)
    try {
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

      const dayNum = dayResult.data.day_number || 1
      let sorted: Step[] = []

      if (stepsResult.success && stepsResult.data) {
        sorted = stepsResult.data.sort((a, b) => a.order - b.order)
        if (userProfile) {
          sorted = injectTriggerBranchSteps(sorted, userProfile, dayNum)
        }
        setSteps(sorted)
      } else {
        console.error('Failed to fetch steps:', stepsResult.error)
      }

      if (dayNum > 1 && !isPremium) {
        navigate('/paywall')
        return
      }

      if ((dayNum === 15 || dayNum === 30) && user?.id) {
        const hasAssessment = await beliefService.hasAssessmentForDay(user.id, dayNum)
        if (!hasAssessment) {
          setBeliefDay(dayNum as 15 | 30)
          setShowBeliefAssessment(true)
        }
      }

      if (user?.id) {
        const saveFallback = (content: PersonalizedContent) => {
          setPersonalizedContent(content)
          sessionPersonalizationService.saveContentPayload(user.id, dayNum, content, 'fallback', dayId).catch(() => {})
        }

        const profileFallback = userProfile
          ? {
              ...buildFallbackPersonalizedContent(userProfile, dayNum, dayResult.data?.title),
              trigger_check: buildFallbackTriggerCheck(userProfile),
              comprehension_check: buildFallbackComprehensionCheck(dayNum, dayResult.data?.title),
            }
          : null

        // ponytail: hydrate checks immediately so step-0 trigger gate isn't skipped while AI loads
        if (profileFallback) {
          const comprehension = buildFallbackComprehensionCheck(dayNum, dayResult.data?.title)
          const stored = await sessionPersonalizationService.getStoredPersonalization(user.id, dayNum)
          setPersonalizedContent(
            stored
              ? { ...profileFallback, ...stored, comprehension_check: comprehension }
              : { ...profileFallback, comprehension_check: comprehension }
          )
        }

        aiService.getPersonalizedSessionContent(user.id, dayNum, dayId)
          .then(content => {
            const comprehension = buildFallbackComprehensionCheck(dayNum, dayResult.data?.title)
            if (content) {
              setPersonalizedContent(
                profileFallback
                  ? { ...profileFallback, ...content, comprehension_check: comprehension }
                  : { ...content, comprehension_check: comprehension }
              )
            } else if (profileFallback) {
              saveFallback({ ...profileFallback, comprehension_check: comprehension })
            }
          })
          .catch(() => {
            if (profileFallback) saveFallback(profileFallback)
          })
      }

      let progress: SessionProgress | null = null
      if (progressResult.success) {
        progress = progressResult.data || null
        if (progress && progress.id) {
          setSessionProgress(progress)
          const reviewing = progress.status === SessionStatus.COMPLETED

          if (reviewing) {
            setCurrentStepIndex(0)
            setTriggerCheckDone(true)
            setComprehensionCheckDone(true)
            const responses = await sessionService.getStepResponsesByUser(user.id)
            if (responses.success && responses.data) {
              setSavedResponses(responses.data)
            }
          } else {
            setCurrentStepIndex(progress.last_step_index || 0)
            if (progress.last_step_index && progress.last_step_index > 0) {
              setTriggerCheckDone(true)
            }
            const checkpoint = getComprehensionCheckpointIndex(sorted)
            if (
              checkpoint !== null &&
              progress.last_step_index != null &&
              progress.last_step_index > checkpoint
            ) {
              setComprehensionCheckDone(true)
            }

            if (progress.status === SessionStatus.NOT_STARTED) {
              const updateResult = await sessionService.upsertSessionProgress(user.id, dayId, {
                status: SessionStatus.IN_PROGRESS,
              })
              if (updateResult.success && updateResult.data) {
                setSessionProgress(updateResult.data)
              }
              analyticsService.trackSessionStarted(user.id, dayNum).catch(() => {})
              sessionService.markProgramStarted(user.id).catch(() => {})
            }

            if (dayId && (progress.status === SessionStatus.IN_PROGRESS || (progress.last_step_index ?? 0) > 0)) {
              startSessionSegment(dayId)
            }
          }
        } else {
          setSavedResponses({})
          const newProgressResult = await sessionService.upsertSessionProgress(user.id, dayId, {
            status: SessionStatus.IN_PROGRESS,
            last_step_index: 0,
          })
          if (newProgressResult.success && newProgressResult.data) {
            setSessionProgress(newProgressResult.data)
          }
          analyticsService.trackSessionStarted(user.id, dayNum).catch(() => {})
          sessionService.markProgramStarted(user.id).catch(() => {})
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

  const proceedToNextStepIndex = async (): Promise<boolean> => {
    if (!user?.id || !dayId) return false
    if (savingLockRef.current) return false

    if (currentStepIndex === steps.length - 1) {
      if (isReviewMode) {
        navigate('/sessions')
        return true
      }
      await runCompleteSession()
      return true
    }

    const nextIndex = currentStepIndex + 1
    setCurrentStepIndex(nextIndex)
    if (!isReviewMode) {
      await sessionService.upsertSessionProgress(user.id, dayId, {
        last_step_index: nextIndex,
      })
    }
    return true
  }

  const advanceFromStep = async (stepResponse?: unknown): Promise<boolean> => {
    if (!user?.id || !dayId || !steps[currentStepIndex]) return false
    if (savingLockRef.current) return false

    if (isReviewMode) {
      return proceedToNextStepIndex()
    }

    beginSessionTimer()
    if (sessionProgress?.status !== SessionStatus.IN_PROGRESS) {
      try {
        await sessionService.upsertSessionProgress(user.id, dayId, {
          status: SessionStatus.IN_PROGRESS,
          last_step_index: currentStepIndex,
        })
      } catch (error) {
        console.warn('Failed to update session progress:', error)
      }
    }

    savingLockRef.current = true
    setIsSaving(true)
    try {
      const currentStep = steps[currentStepIndex]

      if (stepResponse && currentStep.id && !isInjectedStep(currentStep.id)) {
        const saved = await sessionService.saveStepResponse(
          user.id,
          currentStep.id,
          withStoredQuestion(currentStep, stepResponse),
          { overwrite: true }
        )
        if (!saved.success) {
          console.error('Failed to save step response:', saved.error)
          alert('Could not save your answer. Please try again.')
          return false
        }
      }

      const atTextCheckpoint =
        currentStep.type === StepType.TEXT &&
        comprehensionCheckpoint !== null &&
        currentStepIndex === comprehensionCheckpoint

      const skippedComprehension =
        comprehensionCheckpoint !== null &&
        !comprehensionCheckDone &&
        currentStepIndex > comprehensionCheckpoint

      if (skippedComprehension) {
        setComprehensionCheckDone(true)
      }

      const needsComprehension =
        atTextCheckpoint &&
        !comprehensionCheckDone &&
        !skippedComprehension &&
        Boolean(personalizedContent?.comprehension_check)

      if (needsComprehension) {
        setShowComprehensionCheck(true)
        return false
      }

      if (currentStepIndex === steps.length - 1) {
        await runCompleteSession({ alreadyLocked: true })
        return true
      }

      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      await sessionService.upsertSessionProgress(user.id, dayId, {
        last_step_index: nextIndex,
      })
      return true
    } catch (error) {
      console.error('Failed to move to next step:', error)
      alert('Failed to move to next step. Please try again.')
      return false
    } finally {
      savingLockRef.current = false
      setIsSaving(false)
    }
  }

  const moveToNextStep = async (stepResponse?: unknown): Promise<boolean> => {
    if (!user?.id || !dayId || !steps[currentStepIndex]) return false
    if (savingLockRef.current || isSaving) return false

    const needsTriggerCheck =
      currentStepIndex === 0 &&
      !triggerCheckDone &&
      personalizedContent?.trigger_check &&
      !showTriggerCheck

    if (needsTriggerCheck) {
      setShowTriggerCheck(true)
      return false
    }

    return advanceFromStep(stepResponse)
  }

  const handleComprehensionPass = async (result: { selected_index: number; selected: string }) => {
    setComprehensionCheckDone(true)
    setShowComprehensionCheck(false)
    if (user?.id && dayId && personalizedContent?.comprehension_check) {
      const check = personalizedContent.comprehension_check
      sessionPersonalizationService.saveComprehensionCheck(user.id, dayNumber, dayId, {
        question: check.question,
        options: check.options,
        selected_index: result.selected_index,
        selected: result.selected,
        correct_index: check.correct_index,
        is_correct: true,
        thought_of_the_day: check.thought_of_the_day,
      }).catch(() => {})
      analyticsService.trackEvent('comprehension_check_passed', { day: dayNumber }, user.id).catch(() => {})
    }
    await proceedToNextStepIndex()
  }

  const handleComprehensionReview = () => {
    setShowComprehensionCheck(false)
    setCurrentStepIndex(0)
    if (user?.id && dayId) {
      sessionPersonalizationService.saveComprehensionReread(user.id, dayNumber, dayId).catch(() => {})
      sessionService.upsertSessionProgress(user.id, dayId, { last_step_index: 0 }).catch(() => {})
      analyticsService.trackEvent('comprehension_reread_requested', { day: dayNumber }, user.id).catch(() => {})
    }
  }

  const handleTriggerCheckComplete = async (selected: string) => {
    setTriggerCheckDone(true)
    setShowTriggerCheck(false)
    if (user?.id && dayId && personalizedContent?.trigger_check) {
      const check = personalizedContent.trigger_check
      const selectedIndex = check.options.indexOf(selected)
      sessionPersonalizationService.saveTriggerCheck(user.id, dayNumber, dayId, {
        question: check.question,
        options: check.options,
        selected,
        ...(selectedIndex >= 0 ? { selected_index: selectedIndex } : {}),
      }).catch(() => {})
      analyticsService.trackEvent('trigger_check_answered', {
        day: dayNumber,
        answer: selected,
        trigger: userProfile?.primary_trigger,
      }, user.id).catch(() => {})
    }
    await advanceFromStep()
  }

  const runCompleteSession = async (opts?: { alreadyLocked?: boolean }) => {
    if (isReviewMode) {
      navigate('/sessions')
      return
    }
    if (!user?.id || !dayId) {
      console.warn('Cannot complete session: missing required data', { user: user?.id, dayId })
      return
    }
    if (!opts?.alreadyLocked) {
      if (savingLockRef.current) return
      savingLockRef.current = true
      setIsSaving(true)
    }
    try {
      if (dayId) pauseSessionSegment(dayId)
      const totalSeconds = dayId ? getSessionElapsedSeconds(dayId) : 0
      const minutesForStorage = elapsedToStorageMinutes(totalSeconds)
      setCompletedDurationSeconds(totalSeconds)
      if (dayId) clearSessionTimer(dayId)

      const result = await sessionService.completeSession(user.id, dayId, minutesForStorage)

      if (result.success) {
        await achievementService.checkAndUnlock(user.id)
        await refreshProgress()
        await fetchCurrentSession()
        await analyticsService.trackSessionCompleted(
          user.id,
          programDay?.day_number || 1,
          minutesForStorage
        )
        behaviorProfileService.computeAndSave(user.id).catch(() => {})
        setShowCompletionModal(true)
      } else {
        console.error('Failed to complete session:', result.error)
        alert(result.error || 'Failed to complete session. Please try again.')
      }
    } catch (error) {
      console.error('Failed to complete session:', error)
      alert('Failed to complete session. Please try again.')
    } finally {
      if (!opts?.alreadyLocked) {
        savingLockRef.current = false
        setIsSaving(false)
      }
    }
  }

  const saveStepResponseOnly = async (response: unknown): Promise<boolean> => {
    if (isReviewMode) return true
    const step = steps[currentStepIndex]
    if (!user?.id || !step?.id || isInjectedStep(step.id)) {
      return true
    }
    setIsSaving(true)
    try {
      const saved = await sessionService.saveStepResponse(
        user.id,
        step.id,
        withStoredQuestion(step, response),
        { overwrite: true }
      )
      if (!saved.success) {
        console.error('Failed to save step response:', saved.error)
        alert('Could not save your answer. Please try again.')
        return false
      }
      return true
    } finally {
      setIsSaving(false)
    }
  }

  const handleStepResponse = (response: unknown) => moveToNextStep(response)

  const renderStepComponent = () => {
    if (!steps[currentStepIndex]) return null

    const step = steps[currentStepIndex]
    const saved = step.id ? savedResponses[step.id] : undefined
    const savedObj =
      saved && typeof saved === 'object' && !Array.isArray(saved)
        ? (saved as Record<string, unknown>)
        : null

    switch (step.type) {
      case StepType.TEXT:
        return <TextStepComponent step={step} onNext={() => moveToNextStep()} />

      case StepType.QUESTION_MCQ:
        return (
          <MCQStepComponent
            key={`${step.id}-${isReviewMode ? 'r' : 'e'}`}
            step={step}
            onNext={handleStepResponse}
            readOnly={isReviewMode}
            initialSelected={
              typeof savedObj?.selected_option === 'number' ? savedObj.selected_option : null
            }
          />
        )

      case StepType.QUESTION_OPEN:
        return (
          <OpenQuestionComponent
            key={`${step.id}-${isReviewMode ? 'r' : 'e'}`}
            step={step}
            onNext={handleStepResponse}
            onSavePartial={isReviewMode ? undefined : saveStepResponseOnly}
            readOnly={isReviewMode}
            initialResponse={
              Array.isArray(savedObj?.answers)
                ? { answers: savedObj.answers as { prompt: string; answer: string }[] }
                : null
            }
          />
        )

      case StepType.EXERCISE:
        return (
          <ExerciseComponent
            key={`${step.id}-${isReviewMode ? 'r' : 'e'}`}
            step={step}
            onNext={(response) => moveToNextStep(response)}
            focusLabel={
              isInjectedStep(step.id) ? triggerExerciseHint : undefined
            }
            readOnly={isReviewMode}
            initialResponse={
              savedObj?.worksheet
                ? { worksheet: savedObj.worksheet as any }
                : null
            }
          />
        )

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

  if (isLoading || (routeDayKey && !dayId && currentSession?.program)) {
    return (
      <div className="min-h-screen min-h-[100dvh] pb-20">
        <TopNavigation left="back" center="Loading..." right="" />
        <div className="app-container px-3 sm:px-4 pt-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <Mascot size="xl" pulse className="w-32 h-32 sm:w-48 sm:h-48" />
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

  const isLastStep = currentStepIndex === steps.length - 1
  const showUpgradeOverlay = needsDay2Upgrade(isPremium, currentSession?.current_day)

  return (
    <div className="relative h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background">
      <TopNavigation
        left="back"
        center={`Day ${programDay.day_number}: Step ${currentStepIndex + 1}/${steps.length}`}
        right=""
      />

      <div
        ref={scrollRef}
        className={`flex-1 min-h-0 overflow-y-auto app-container px-3 sm:px-4 pt-4 sm:pt-6 scrollbar-thin ${
          showUpgradeOverlay
            ? 'pb-28'
            : !showTriggerCheck && !stepRequiresInput
              ? 'pb-4'
              : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]'
        }`}
        {...swipeHandlers}
      >
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

        {statCard && currentStepIndex === 0 && !showTriggerCheck && !showComprehensionCheck && (
          <SessionStatCard stat={statCard} />
        )}

        {showTriggerCheck && personalizedContent?.trigger_check && (
          <TriggerCheckMCQ
            check={personalizedContent.trigger_check}
            onComplete={handleTriggerCheckComplete}
          />
        )}

        {showComprehensionCheck && personalizedContent?.comprehension_check && (
          <div className="relative z-10 mb-4">
            <ComprehensionCheck
              check={personalizedContent.comprehension_check}
              onPass={handleComprehensionPass}
              onReview={handleComprehensionReview}
              onFail={(result) => {
                if (user?.id && dayId && personalizedContent?.comprehension_check) {
                  const check = personalizedContent.comprehension_check
                  sessionPersonalizationService.saveComprehensionCheck(user.id, dayNumber, dayId, {
                    question: check.question,
                    options: check.options,
                    selected_index: result.selected_index,
                    selected: result.selected,
                    correct_index: check.correct_index,
                    is_correct: false,
                    thought_of_the_day: check.thought_of_the_day,
                  }).catch(() => {})
                  analyticsService.trackEvent('comprehension_check_failed', { day: dayNumber }, user.id).catch(() => {})
                }
              }}
            />
          </div>
        )}

        {!showTriggerCheck && (
          <div className={showComprehensionCheck ? 'pointer-events-none opacity-40 mb-4' : 'mb-4'}>
          <GlassCard
            className={`p-4 sm:p-6 ${
              currentStep.type === StepType.QUESTION_OPEN ||
              currentStep.type === StepType.EXERCISE ||
              currentStep.type === StepType.TEXT
                ? 'session-paper'
                : ''
            }`}
          >
            {isReviewMode && (
              <div className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700">
                Viewing a completed day, and your answers are saved and can’t be changed.
              </div>
            )}
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-1">
                {dayTitle}
              </h2>
              {daySubtitle ? (
                <p className="text-xs sm:text-sm text-text-primary/60 mb-2 sm:mb-3">{daySubtitle}</p>
              ) : null}
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

            <div className="mt-4">
              {renderStepComponent()}
            </div>
          </GlassCard>
          </div>
        )}
      </div>

      {/* Back/Next chrome — only when step doesn't own its Continue (avoids orphan arrow bar) */}
      {!showTriggerCheck && !stepRequiresInput && (
        <div
          className={`flex-shrink-0 app-container px-3 sm:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-[#0E2538]/06 bg-background ${
            showComprehensionCheck ? 'pointer-events-none opacity-40' : ''
          }`}
        >
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
      )}

      {/* Glass unlock bar floats over session content — parallel, no scrim */}
      {showUpgradeOverlay && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-40 px-3 sm:px-4 ${
            !showTriggerCheck && !stepRequiresInput
              ? 'bottom-[4.75rem]'
              : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'
          }`}
        >
          <div className="pointer-events-auto upgrade-glass-overlay">
            <UpgradePrompt variant="overlay" />
          </div>
        </div>
      )}

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        dayNumber={programDay.day_number || 1}
        timeSpentSeconds={completedDurationSeconds}
        stepsCompleted={steps.length}
        hasNextDay={(programDay.day_number || 0) < 30}
        nextCtaLabel={!isPremium ? 'Unlock Day 2' : 'Next Day'}
        onNextDay={() => {
          setShowCompletionModal(false)
          // Free users finish Day 1 → paywall before Day 2
          if (!isPremium) {
            navigate('/paywall')
            return
          }
          navigate('/sessions')
        }}
      />

      {isSaving && (
        <div
          className="fixed inset-0 z-[90] bg-[#0E2538]/35 backdrop-blur-[2px] flex items-center justify-center px-6"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="w-full max-w-xs rounded-3xl bg-white shadow-xl border border-[#0E2538]/08 px-6 py-7 flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-[#3F8DD2] border-t-transparent animate-spin" />
            <p className="text-[15px] font-semibold text-[#0E2538] text-center">
              {currentStepIndex >= steps.length - 1 && !isReviewMode
                ? 'Completing your day…'
                : 'Saving…'}
            </p>
            <p className="text-xs text-[#0E2538]/45 text-center">Please wait — don’t tap again</p>
          </div>
        </div>
      )}
      <KycRequiredModal
        isOpen={showKycModal}
        onClose={() => {
          setShowKycModal(false)
          navigate('/sessions')
        }}
      />
    </div>
  )
}
