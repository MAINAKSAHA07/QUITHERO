import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Lock, Play, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
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
  const { user } = useApp()
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

  const handleDayClick = (d: DayWithProgress) => {
    if (d.isLocked) return
    if (d.day.id) navigate(`/sessions/${d.day.id}`)
  }

  const completedCount = daysWithProgress.filter(d => d.status === SessionStatus.COMPLETED).length
  const totalDays = daysWithProgress.length || 30

  if (isLoading || loading) {
    return (
      <div className="min-h-screen pb-24 bg-background">
        <TopNavigation left="menu" center="Program" right="" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <img src="/mascot.png" alt="Loading" className="w-32 h-32 object-contain animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading sessions...</p>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      <TopNavigation
        left="menu"
        center="Program"
        right={<button onClick={loadSessions} className="p-2 rounded-full hover:bg-muted"><RefreshCw className="w-5 h-5 text-foreground" /></button>}
      />

      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* Progress Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold text-foreground">30-Day Reset</h1>
                <Badge variant="secondary">{completedCount}/{totalDays}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Rewire your brain. One day at a time.</p>
              <Progress value={(completedCount / totalDays) * 100} />
            </CardContent>
          </Card>
        </motion.div>


        {/* Day List */}
        <div className="space-y-2">
          {daysWithProgress.map((d, i) => {
            const isCompleted = d.status === SessionStatus.COMPLETED
            const isInProgress = d.status === SessionStatus.IN_PROGRESS
            return (
              <motion.div
                key={d.day.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${d.isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${isInProgress ? 'ring-1 ring-primary' : ''}`}
                  onClick={() => handleDayClick(d)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-success/15' : isInProgress ? 'bg-primary/15' : d.isLocked ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5 text-success" /> :
                       d.isLocked ? <Lock className="w-4 h-4 text-muted-foreground" /> :
                       <span className="text-primary font-bold text-sm">{d.day.day_number}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{d.day.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted ? 'Completed' : isInProgress ? 'In progress' : d.isLocked ? 'Locked' : 'Ready'}
                      </p>
                    </div>
                    {!d.isLocked && !isCompleted && <Play className="w-4 h-4 text-primary flex-shrink-0" />}
                    {isCompleted && <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
