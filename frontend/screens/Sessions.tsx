import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Lock, Calendar, Play, RefreshCw } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
import GlassCard from '../components/GlassCard'
import { useApp } from '../context/AppContext'
import { useSessions } from '../hooks/useSessions'
import { programService } from '../services/program.service'
import { sessionService } from '../services/session.service'
import { SessionStatus } from '../types/enums'
import { ProgramDay, SessionProgress } from '../types/models'

interface DayWithProgress {
  day: ProgramDay
  progress: SessionProgress | null
  isLocked: boolean
  status: SessionStatus
}

export default function Sessions() {
  const navigate = useNavigate()
  const { user } = useApp()
  const { currentSession, loading, fetchCurrentSession } = useSessions()
  const [daysWithProgress, setDaysWithProgress] = useState<DayWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadSessions()
    }
  }, [user?.id, currentSession])

  const loadSessions = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      // Fetch current session if not already loaded
      if (!currentSession) {
        await fetchCurrentSession()
      }

      let programId: string | null = null

      // Try to get program ID from session
      if (currentSession && currentSession.program) {
        programId = typeof currentSession.program === 'string'
          ? currentSession.program
          : (currentSession.program as any)?.id || currentSession.program
      }

      // If no session exists, fetch the active program directly
      if (!programId) {
        const programResult = await programService.getActiveProgram('en')
        if (programResult.success && programResult.data) {
          programId = programResult.data.id!
          // Create session for user if it doesn't exist
          if (programId) {
            await sessionService.createOrGetSession(user.id, programId)
            // Refresh session
            await fetchCurrentSession()
          }
        }
      }

      if (!programId) {
        console.error('Program ID not found')
        return
      }

      // Fetch program days
      const daysResult = await programService.getProgramDays(programId)
      if (daysResult.success && daysResult.data) {
        const days = daysResult.data

        // Fetch progress for ALL days in parallel (much faster!)
        const progressPromises = days.map((day) => {
          if (!day.id) {
            console.error('Day missing ID:', day)
            return Promise.resolve({ success: true, data: null })
          }
          return sessionService.getSessionProgress(user.id, day.id)
        })

        const progressResults = await Promise.all(progressPromises)

        // Process results and determine locked status
        const daysWithProgressData: DayWithProgress[] = days.map((day, i) => {
          const progressResult = progressResults[i]
          const progress = progressResult.success ? progressResult.data : null
          const status = progress?.status || SessionStatus.NOT_STARTED

          // Determine if locked: Day 1 is always unlocked, Day N is unlocked if Day N-1 is completed
          let isLocked = false
          if (i === 0) {
            isLocked = false // Day 1 always unlocked
          } else {
            const prevStatus = progressResults[i - 1].success
              ? (progressResults[i - 1].data?.status || SessionStatus.NOT_STARTED)
              : SessionStatus.NOT_STARTED
            isLocked = prevStatus !== SessionStatus.COMPLETED
          }

          return {
            day,
            progress: progress || null,
            isLocked,
            status,
          }
        })

        setDaysWithProgress(daysWithProgressData)
      } else {
        console.error('Failed to fetch program days:', daysResult.error)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDayClick = (dayWithProgress: DayWithProgress) => {
    if (dayWithProgress.isLocked) {
      // Show toast message
      alert('Complete previous day first')
      return
    }

    if (dayWithProgress.day.id) {
      navigate(`/sessions/${dayWithProgress.day.id}`)
    }
  }

  // const getButtonText = (dayWithProgress: DayWithProgress) => {
  //   if (dayWithProgress.isLocked) return 'Locked'
  //   if (dayWithProgress.status === SessionStatus.COMPLETED) return 'Review'
  //   if (dayWithProgress.status === SessionStatus.IN_PROGRESS) return 'Continue'
  //   return 'Start'
  // }

  const completedCount = daysWithProgress.filter(
    (d) => d.status === SessionStatus.COMPLETED
  ).length
  if (isLoading || loading) {
    return (
      <div className="min-h-screen pb-24">
        <TopNavigation left="menu" center="10-Day Program" right="" />
        <div className="max-w-md mx-auto px-4 pt-6 pb-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <img
              src="/mascot.png"
              alt="Loading..."
              className="w-48 h-48 object-contain animate-bounce"
            />
            <p className="text-text-primary/70 text-base font-medium">Loading your sessions...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <TopNavigation
        left="menu"
        center="10-Day Program"
        right={
          <button onClick={loadSessions} className="p-2">
            <RefreshCw className="w-5 h-5 text-text-primary" />
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Your 10-Day Transformation
          </h1>
          <p className="text-text-primary/70">
            Complete daily sessions to build lasting habits
          </p>
        </motion.div>

        <div className="space-y-3">
          {daysWithProgress.map((dayWithProgress, index) => {
            const { day, status, isLocked } = dayWithProgress
            const isCompleted = status === SessionStatus.COMPLETED
            const isInProgress = status === SessionStatus.IN_PROGRESS

            return (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  hover={!isLocked}
                  onClick={() => handleDayClick(dayWithProgress)}
                  className={`p-4 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-success/20'
                          : isInProgress
                          ? 'bg-brand-primary/20'
                          : isLocked
                          ? 'bg-text-primary/10'
                          : 'bg-brand-primary/20'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-text-primary/30" />
                      ) : (
                        <span className="text-brand-primary font-bold">{day.day_number}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-brand-primary flex-shrink-0" />
                        <span className="text-xs font-medium text-brand-primary">
                          Day {day.day_number}
                        </span>
                      </div>
                      <div className="font-medium text-text-primary truncate">{day.title}</div>
                      <div className="text-xs text-text-primary/50 mt-1">
                        {isCompleted
                          ? 'Completed'
                          : isInProgress
                          ? `In Progress - Step ${dayWithProgress.progress?.last_step_index || 0}`
                          : isLocked
                          ? 'Locked'
                          : 'Available now'}
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    )}
                    {!isLocked && !isCompleted && (
                      <Play className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <GlassCard className="p-6 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-primary mb-2">
                {completedCount}/{daysWithProgress.length || 10}
              </div>
              <div className="text-sm text-text-primary/70 mb-4">Sessions Completed</div>
              <div className="h-2 glass rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((completedCount || 0) / (daysWithProgress.length || 10)) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <BottomNavigation />
    </div>
  )
}

