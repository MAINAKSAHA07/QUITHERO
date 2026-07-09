import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, RefreshCw, Menu } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import SmonoLogo from '../components/SmonoLogo'
import Mascot from '../components/Mascot'
import BottomNavigation from '../components/BottomNavigation'
import Sidebar from '../components/Sidebar'
import { useApp } from '../context/AppContext'
import { programService } from '../services/program.service'
import { SessionStatus } from '../types/enums'
import { ProgramDay, SessionProgress } from '../types/models'
import pb from '../lib/pocketbase'
import {
  indexProgressByDayId,
  isDayUnlocked,
  dayStatus,
} from '../utils/programProgress'
import KycRequiredModal from '../components/KycRequiredModal'
import { useKycGate } from '../hooks/useKycGate'

interface DayWithProgress {
  day: ProgramDay
  progress: SessionProgress | null
  isLocked: boolean
  status: SessionStatus
}

const _cache: {
  programId?: string
  days?: ProgramDay[]
} = {}

function sessionSubtitle(
  d: DayWithProgress,
  isFreemiumLocked: boolean,
  showAsLocked: boolean
): string {
  if (isFreemiumLocked) return 'Premium'
  if (d.status === SessionStatus.COMPLETED) {
    const mins = d.progress?.time_spent_minutes ?? d.day.estimated_duration_min
    return mins ? `Completed · ${mins} min` : 'Completed'
  }
  if (d.status === SessionStatus.IN_PROGRESS) {
    const est = d.day.estimated_duration_min ?? 20
    return `In progress · ~${est} min`
  }
  if (showAsLocked) return 'Locked'
  return 'Ready'
}

export default function Sessions() {
  const navigate = useNavigate()
  const { user, isPremium, currentSession, fetchCurrentSession } = useApp()
  const { showKycModal, setShowKycModal, gateSessionAccess } = useKycGate()
  const [daysWithProgress, setDaysWithProgress] = useState<DayWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    if (user?.id) loadSessions(false)
  }, [user?.id, currentSession?.id])

  const loadSessions = async (forceRefresh = false) => {
    if (!user?.id) return
    if (!hasLoadedOnce.current) setIsLoading(true)
    let waitingForSession = false
    try {
      let session = currentSession
      if (!session?.program) {
        await fetchCurrentSession()
        waitingForSession = true
        return
      }

      const programId = typeof session.program === 'string'
        ? session.program
        : (session.program as { id?: string })?.id || null

      if (!programId) return
      let days: ProgramDay[]
      if (!forceRefresh && _cache.programId === programId && _cache.days) {
        days = _cache.days
      } else {
        const daysResult = await programService.getProgramDays(programId)
        if (!daysResult.success || !daysResult.data) return
        days = daysResult.data
        _cache.programId = programId
        _cache.days = days
      }

      const allProgress = await pb.collection('session_progress').getFullList<SessionProgress & { id: string }>({
        filter: `user = "${user.id}"`,
        fields: 'id,program_day,status,last_step_index,completed_at,time_spent_minutes',
      }).catch(() => [] as SessionProgress[])

      const progressByDay = indexProgressByDayId(allProgress)

      setDaysWithProgress(days.map((day, i) => {
        const progress = day.id ? (progressByDay.get(day.id) ?? null) : null
        const status = dayStatus(day, progressByDay)
        const isLocked = !isDayUnlocked(i, days, progressByDay)
        return { day, progress, isLocked, status }
      }))
      hasLoadedOnce.current = true
    } finally {
      if (!waitingForSession) setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    _cache.programId = undefined
    hasLoadedOnce.current = false
    loadSessions(true)
  }

  const handleDayClick = (d: DayWithProgress, dayIndex: number) => {
    if (!isPremium && dayIndex > 0) { navigate('/paywall'); return }
    if (d.isLocked) return
    if (!d.day.id) return
    gateSessionAccess(() => navigate(`/sessions/${d.day.id}`))
  }

  const headerChromeBtn =
    'w-9 h-9 rounded-lg bg-white/60 border border-sky-200/40 flex items-center justify-center hover:bg-white/80 transition-colors touch-target'

  if (isLoading) {
    return (
      <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5">
        <div className="flex-shrink-0">
          <TopNavigation left="menu" center={<SmonoLogo size="sm" showMascot layout="inline" />} right="" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Mascot size="lg" pulse className="w-24 h-24 sm:w-32 sm:h-32" />
          <p className="text-text-primary/70 text-sm">Loading sessions...</p>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5">
      <div className="flex-shrink-0">
        <TopNavigation
          left={
            <button type="button" onClick={() => setSidebarOpen(true)} className={headerChromeBtn} aria-label="Open menu">
              <Menu className="w-4 h-4 text-text-primary/70" />
            </button>
          }
          center={<SmonoLogo size="sm" showMascot layout="inline" />}
          right={
            <button type="button" onClick={handleRefresh} className={headerChromeBtn} aria-label="Refresh sessions">
              <RefreshCw className="w-4 h-4 text-text-primary/70" />
            </button>
          }
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 scrollbar-thin">
        <h1 className="text-center text-base font-bold text-text-primary mb-4">30-Day Program</h1>

        <div className="space-y-2">
          {daysWithProgress.map((d, i) => {
            const isCompleted = d.status === SessionStatus.COMPLETED
            const isInProgress = d.status === SessionStatus.IN_PROGRESS
            const isFreemiumLocked = !isPremium && i > 0
            const effectiveLocked = d.isLocked || isFreemiumLocked
            const showAsLocked = effectiveLocked && !isInProgress && !isCompleted
            const subtitle = sessionSubtitle(d, isFreemiumLocked, showAsLocked)

            return (
              <motion.button
                key={d.day.id}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.45) }}
                onClick={() => handleDayClick(d, i)}
                disabled={showAsLocked}
                className={`w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-colors ${
                  isInProgress && !isFreemiumLocked
                    ? 'border-brand-primary/45 bg-brand-primary/8 hover:bg-brand-primary/12'
                    : showAsLocked
                    ? 'border-white/20 bg-white/50 opacity-60 cursor-not-allowed'
                    : 'border-sky-200/35 bg-white/75 hover:bg-white/90'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isCompleted && !isFreemiumLocked
                      ? 'bg-emerald-500 text-white'
                      : isInProgress && !isFreemiumLocked
                      ? 'bg-brand-primary text-white'
                      : 'bg-sky-100 text-brand-primary/70'
                  }`}
                >
                  {isCompleted && !isFreemiumLocked ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <span>{d.day.day_number}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${showAsLocked ? 'text-text-primary/55' : 'text-text-primary'}`}>
                    {d.day.title}
                  </p>
                  <p className="text-xs text-text-primary/45 mt-0.5">{subtitle}</p>
                </div>

                {isCompleted && !isFreemiumLocked && (
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600">
                    Done
                  </span>
                )}
                {isInProgress && !isFreemiumLocked && (
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-primary/15 text-brand-primary">
                    Now
                  </span>
                )}
                {isFreemiumLocked && (
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600">
                    Pro
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      <BottomNavigation />
      <KycRequiredModal isOpen={showKycModal} onClose={() => setShowKycModal(false)} />
    </div>
  )
}
