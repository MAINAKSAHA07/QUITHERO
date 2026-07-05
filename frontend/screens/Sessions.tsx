import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Lock, Play, RefreshCw } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import { Progress } from '../components/ui/progress'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
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
  const { user, isPremium } = useApp()
  const { currentSession, loading, fetchCurrentSession } = useSessions()
  const [daysWithProgress, setDaysWithProgress] = useState<DayWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) loadSessions()
  }, [user?.id, currentSession])

  const loadSessions = async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      if (!currentSession) await fetchCurrentSession()

      let programId: string | null = null
      if (currentSession && currentSession.program) {
        programId = typeof currentSession.program === 'string'
          ? currentSession.program
          : (currentSession.program as any)?.id || currentSession.program
      }

      if (!programId) {
        const programResult = await programService.getActiveProgram('en')
        if (programResult.success && programResult.data) {
          programId = programResult.data.id!
          if (programId) {
            await sessionService.createOrGetSession(user.id, programId)
            await fetchCurrentSession()
          }
        }
      }

      if (!programId) return

      const daysResult = await programService.getProgramDays(programId)
      if (daysResult.success && daysResult.data) {
        const days = daysResult.data
        const progressResults = await Promise.all(
          days.map((day) => day.id
            ? sessionService.getSessionProgress(user.id, day.id)
            : Promise.resolve({ success: true, data: null })
          )
        )

        setDaysWithProgress(days.map((day, i) => {
          const progress = progressResults[i].success ? progressResults[i].data : null
          const status = progress?.status || SessionStatus.NOT_STARTED
          const isLocked = i === 0 ? false
            : (progressResults[i - 1].data?.status || SessionStatus.NOT_STARTED) !== SessionStatus.COMPLETED
          return { day, progress: progress || null, isLocked, status }
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDayClick = (d: DayWithProgress, dayIndex: number) => {
    if (!isPremium && dayIndex > 0) {
      navigate('/paywall')
      return
    }
    if (d.isLocked) return
    if (d.day.id) navigate(`/sessions/${d.day.id}`)
  }

  const completedCount = daysWithProgress.filter(d => d.status === SessionStatus.COMPLETED).length
  const totalDays = daysWithProgress.length || 30

  if (isLoading || loading) {
    return (
      <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5">
        {/* Pinned Top Navigation */}
        <div className="flex-shrink-0">
          <TopNavigation left="menu" center="Program" right="" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <img src="/mascot.png" alt="Loading" className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-pulse" />
          <p className="text-text-primary/70 text-sm">Loading sessions...</p>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5">
      {/* Pinned Top Navigation */}
      <div className="flex-shrink-0">
        <TopNavigation
          left="menu"
          center="Program"
          right={<button onClick={loadSessions} className="p-2 rounded-full hover:bg-white/5 touch-target"><RefreshCw className="w-5 h-5 text-text-primary" /></button>}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin pb-24 space-y-5">
        {/* Progress Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-text-primary">30-Day Reset</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-brand-primary border border-white/5">
                {completedCount}/{totalDays}
              </span>
            </div>
            <p className="text-xs text-text-primary/60 mb-3">Rewire your brain. One day at a time.</p>
            <Progress value={(completedCount / totalDays) * 100} className="bg-white/5 h-2" />
          </GlassCard>
        </motion.div>

        {/* Day List */}
        <div className="space-y-2">
          {daysWithProgress.map((d, i) => {
            const isCompleted = d.status === SessionStatus.COMPLETED
            const isInProgress = d.status === SessionStatus.IN_PROGRESS
            const isFreemiumLocked = !isPremium && i > 0
            const effectiveLocked = d.isLocked || isFreemiumLocked
            return (
              <motion.div
                key={d.day.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard
                  className={`cursor-pointer hover:bg-white/10 ${effectiveLocked ? 'opacity-50 cursor-not-allowed' : ''} ${isInProgress && !isFreemiumLocked ? 'border-brand-primary/50' : ''}`}
                  onClick={() => handleDayClick(d, i)}
                >
                  <div className="p-3.5 flex items-center gap-3">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted && !isFreemiumLocked ? 'bg-emerald-500/10 border border-emerald-500/20' : isInProgress && !isFreemiumLocked ? 'bg-brand-primary/10 border border-brand-primary/20 animate-pulse' : effectiveLocked ? 'bg-white/5 border border-white/5' : 'bg-brand-primary/10 border border-brand-primary/10'
                    }`}>
                      {isCompleted && !isFreemiumLocked ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> :
                       effectiveLocked ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-primary/40" /> :
                       <span className="text-brand-primary font-black text-xs sm:text-sm">{d.day.day_number}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary text-xs sm:text-sm truncate">{d.day.title}</p>
                      <p className="text-[10px] font-semibold text-text-primary/45 uppercase tracking-wide">
                        {isFreemiumLocked ? 'Premium' : isCompleted ? 'Completed' : isInProgress ? 'In progress' : d.isLocked ? 'Locked' : 'Ready'}
                      </p>
                    </div>
                    {!effectiveLocked && !isCompleted && <Play className="w-4 h-4 text-brand-primary flex-shrink-0" />}
                    {isCompleted && !isFreemiumLocked && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    {isFreemiumLocked && <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
