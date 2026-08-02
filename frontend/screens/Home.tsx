import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar,
  Cigarette,
  Droplet,
  Wind,
  ArrowRight,
  RefreshCw,
  Shield,
  BookOpen,
  Flame,
  ChevronRight,
  Menu,
  MessageCircle,
} from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import Sidebar from '../components/Sidebar'
import { appHeaderBtn } from '../components/AppHeader'
import MilestoneModal from '../components/MilestoneModal'
import AchievementNotification from '../components/AchievementNotification'
import TranslatedText from '../components/TranslatedText'
import Mascot from '../components/Mascot'
import { useApp } from '../context/AppContext'
import { useProgress } from '../hooks/useProgress'
import { useAchievements } from '../hooks/useAchievements'
import { cravingService } from '../services/craving.service'
import { programService } from '../services/program.service'
import { sessionService } from '../services/session.service'
import { analyticsService } from '../services/analytics.service'
import { CravingType, CravingTrigger, SessionStatus } from '../types/enums'
import { haptic, hapticPatterns } from '../utils/haptic'
import { formatMoney, getCountryConfig } from '../utils/currency'
import { formatSlipLifeLost, formatSlipLoss, formatSlipNicotine } from '../utils/slipCost'
import { countTodayCravingActivity } from '../utils/cravingDayCounts'
import KycRequiredModal from '../components/KycRequiredModal'
import UpgradePrompt from '../components/UpgradePrompt'
import { useKycGate } from '../hooks/useKycGate'
import { needsDay2Upgrade } from '../utils/upgradePrompt'
import { greetingForHour } from '../utils/reminderTime'
import { pb } from '../lib/pocketbase'
import {
  consecutiveCompletedCount,
  dayLock,
  dayStepFraction,
  expectedCurrentDayNumber,
  formatUnlockWait,
  indexProgressByDayId,
  programCompletionPercent,
} from '../utils/programProgress'
import type { Achievement, SessionProgress } from '../types/models'

const MILESTONE_DAYS = [3, 7, 14, 30]
const CELEBRATION_BURSTS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: (i % 7) * 28 - 84,
  y: -40 - (i % 5) * 18,
  color: ['#3F8DD2', '#6EA48F', '#F6B884', '#E8894A', '#7B6B9B'][i % 5],
  delay: (i % 5) * 0.05,
}))

function milestoneStorageKey(days: number) {
  return `milestone_shown_${days}`
}

function ProgressRing({
  value,
  size = 112,
  celebrate = false,
}: {
  value: number
  size?: number
  celebrate?: boolean
}) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, value))
  const offset = c - (clamped / 100) * c

  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      animate={celebrate ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={celebrate ? { duration: 0.9, repeat: 2, ease: 'easeInOut' } : undefined}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(63, 141, 210, 0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#homeProgressGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="homeProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3F8DD2" />
            <stop offset="85%" stopColor="#3F8DD2" />
            <stop offset="100%" stopColor="#F6B884" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-[#0E2538] leading-none">{clamped}%</span>
        <span className="text-[10px] font-semibold text-[#0E2538]/50 mt-1">Program</span>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user, userProfile, currentSession, sessionLoading, progressStats, fetchCurrentSession, isPremium } = useApp()
  const { showKycModal, setShowKycModal, gateSessionAccess } = useKycGate()
  const { stats, calculation, loading: progressLoading, refresh: refreshProgressData } = useProgress()
  const { checkAndUnlock } = useAchievements()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [slipsCount, setSlipsCount] = useState(0)
  const [todayCravings, setTodayCravings] = useState(0)
  const [todaySlips, setTodaySlips] = useState(0)
  const [milestoneDay, setMilestoneDay] = useState<number | null>(null)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([])
  const [celebrating, setCelebrating] = useState(false)
  const [quickLogging, setQuickLogging] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [programProgress, setProgramProgress] = useState(0)
  const [programStarted, setProgramStarted] = useState(false)
  const [nextDayUnlockAt, setNextDayUnlockAt] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  // ponytail: minute tick — the rest-period countdown is shown in whole minutes.
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const loadData = useCallback(async (refreshProgress = false) => {
    if (!user?.id) return
    setIsRefreshing(true)
    try {
      // Resync current_day from session_progress (Home used to keep a stale day-1 forever)
      await fetchCurrentSession()

      // Adaptive program % — completed days + partial current day (not currentDay/30)
      try {
        const sessionResult = await sessionService.getCurrentSession(user.id)
        const liveSession = sessionResult.success ? sessionResult.data : null
        const programId = liveSession?.program
          ? typeof liveSession.program === 'string'
            ? liveSession.program
            : (liveSession.program as { id?: string })?.id
          : undefined

        if (programId) {
          const daysResult = await programService.getProgramDays(programId)
          const days = daysResult.success && daysResult.data ? daysResult.data : []
          const allProgress = (await pb
            .collection('session_progress')
            .getFullList({
              filter: `user = "${user.id}"`,
              fields: 'id,program_day,status,last_step_index,completed_at',
            })
            .catch(() => [])) as SessionProgress[]
          const progressByDay = indexProgressByDayId(allProgress)
          const completedDays = consecutiveCompletedCount(days, progressByDay)
          const totalDays = days.length || 30
          let currentDayFraction = 0
          const activeDayNum = expectedCurrentDayNumber(days, progressByDay)
          const activeDay = days.find((d) => d.day_number === activeDayNum) || days[activeDayNum - 1]
          const activeProg = activeDay?.id ? progressByDay.get(activeDay.id) : undefined
          const activeIndex = days.findIndex((d) => d.id && d.id === activeDay?.id)
          setNextDayUnlockAt(
            activeIndex >= 0 ? dayLock(activeIndex, days, progressByDay).unlockAtMs : null
          )
          if (activeDay?.id && activeProg?.status === SessionStatus.IN_PROGRESS) {
            const stepsResult = await programService.getSteps(activeDay.id)
            const stepCount = stepsResult.success && stepsResult.data ? stepsResult.data.length : 0
            currentDayFraction = dayStepFraction(activeProg.last_step_index, stepCount)
          }
          setProgramStarted(
            completedDays > 0 ||
              activeProg?.status === SessionStatus.IN_PROGRESS ||
              activeProg?.status === SessionStatus.COMPLETED
          )
          setProgramProgress(
            programCompletionPercent({ totalDays, completedDays, currentDayFraction })
          )
        } else {
          setProgramStarted(false)
          setProgramProgress(0)
          setNextDayUnlockAt(null)
        }
      } catch {
        setProgramStarted(false)
        setProgramProgress(0)
        setNextDayUnlockAt(null)
      }

      const slipsResult = await cravingService.getCountByType(user.id, 'slip')
      setSlipsCount(slipsResult.success && slipsResult.data !== undefined ? slipsResult.data : 0)
      if (refreshProgress) await refreshProgressData()
      try {
        // getByUser includes slips; also treat resolution_method=smoked as a slip.
        const allCravingsResult = await cravingService.getByUser(user.id)
        if (allCravingsResult.success && allCravingsResult.data) {
          const { resisted, slipped } = countTodayCravingActivity(allCravingsResult.data)
          setTodayCravings(resisted)
          setTodaySlips(slipped)
        }
      } catch { /* graceful fallback */ }
    } catch {
      setSlipsCount(0)
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, refreshProgressData, fetchCurrentSession])

  useEffect(() => {
    if (!user?.id) return
    loadData()
    refreshProgressData() // once per user — recalculate smoke-free days
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const days = Math.floor(
      calculation?.days_smoke_free ?? stats?.days_smoke_free ?? progressStats?.days_smoke_free ?? 0
    )
    if (days <= 0) return
    const due = MILESTONE_DAYS.find(
      (m) => days >= m && !localStorage.getItem(milestoneStorageKey(m))
    )
    if (due == null) return
    localStorage.setItem(milestoneStorageKey(due), '1')
    setMilestoneDay(due)
    setCelebrating(true)
    haptic(hapticPatterns.achievement)
  }, [calculation, stats, progressStats])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      const result = await checkAndUnlock()
      if (cancelled || !result?.success || !result.newlyUnlocked?.length) return
      const [first, ...rest] = result.newlyUnlocked
      setNewAchievement(first)
      setPendingAchievements(rest)
      setCelebrating(true)
      haptic(hapticPatterns.achievement)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, checkAndUnlock])

  useEffect(() => {
    if (!celebrating) return
    const t = window.setTimeout(() => setCelebrating(false), 4500)
    return () => window.clearTimeout(t)
  }, [celebrating, milestoneDay, newAchievement])

  const dismissAchievement = () => {
    if (pendingAchievements.length > 0) {
      const [next, ...rest] = pendingAchievements
      setNewAchievement(next)
      setPendingAchievements(rest)
      return
    }
    setNewAchievement(null)
  }

  const handleQuickResist = async () => {
    if (!user?.id || quickLogging) return
    setQuickLogging(true)
    haptic(hapticPatterns.success)
    try {
      await cravingService.create({
        user: user.id,
        type: CravingType.CRAVING,
        intensity: 3,
        trigger: CravingTrigger.HABIT,
      })
      setTodayCravings((prev) => prev + 1)
      analyticsService.trackCravingLogged(user.id, 'craving', 'habit')
    } catch { /* silent */ }
    setQuickLogging(false)
  }

  const displayStats = useMemo(() => {
    const rawDays = calculation?.days_smoke_free ?? progressStats?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    const daysSmokeFree = Math.floor(rawDays)
    const rawStreak = calculation?.current_streak_days ?? 0
    const currentStreakDays = Math.floor(rawStreak)
    const checkIns = calculation?.smoke_free_periods ?? 0
    const cigarettesNotSmoked = calculation?.cigarettes_not_smoked ?? progressStats?.cigarettes_not_smoked ?? stats?.cigarettes_not_smoked ?? 0
    const moneySaved = calculation?.money_saved ?? progressStats?.money_saved ?? stats?.money_saved ?? 0
    const nicotinePerCig = getCountryConfig(userProfile?.country).nicotinePerCigarette
    const nicotineNotConsumed = calculation?.nicotine_not_consumed ?? cigarettesNotSmoked * nicotinePerCig
    const moneySavedFormatted = formatMoney(moneySaved, userProfile?.country)
    const currencySymbol = getCountryConfig(userProfile?.country).symbol
    return {
      daysSmokeFree,
      currentStreakDays,
      rawDays,
      checkIns,
      moneySaved,
      moneySavedFormatted,
      currencySymbol,
      slipsCount,
      nicotineNotConsumed,
      cigarettesNotSmoked,
    }
  }, [stats, calculation, progressStats, slipsCount, userProfile?.country])

  const currentDay = currentSession?.current_day || 1
  const showUpgrade = needsDay2Upgrade(isPremium, currentDay)
  const firstName =
    userProfile?.onboarding_name?.trim() ||
    user?.name?.split(' ')[0] ||
    'there'
  const greeting = greetingForHour(new Date().getHours())

  const restingMs = nextDayUnlockAt != null ? Math.max(0, nextDayUnlockAt - nowMs) : 0

  const handleContinueProgram = async () => {
    if (!user?.id) return
    if (restingMs > 0) {
      navigate('/sessions')
      return
    }
    if (showUpgrade) {
      navigate('/paywall')
      analyticsService.trackEvent('upgrade_cta_clicked', { source: 'home_continue' }, user.id)
      return
    }
    gateSessionAccess(async () => {
      try {
        if (currentSession?.program) {
          const programId = typeof currentSession.program === 'string'
            ? currentSession.program
            : (currentSession.program as any)?.id || currentSession.program
          const dayResult = await programService.getProgramDayByNumber(programId, currentDay)
          if (dayResult.success && dayResult.data) {
            navigate(`/sessions/${dayResult.data.id}`)
            analyticsService.trackEvent('continue_program_clicked', { day: currentDay }, user.id)
            return
          }
        }
        navigate('/sessions')
      } catch {
        navigate('/sessions')
      }
    })
  }

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden relative bg-[#F4FBFF]">
      {/* Soft sky + peach + sage wash (landing palette) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(139, 205, 232, 0.4), transparent 55%), radial-gradient(ellipse 70% 45% at 100% 90%, rgba(246, 184, 132, 0.32), transparent 50%), radial-gradient(ellipse 40% 30% at 70% 30%, rgba(110, 164, 143, 0.14), transparent 50%)',
        }}
        aria-hidden
      />

      <div
        className={`flex-1 overflow-y-auto px-4 safe-area-top scrollbar-thin relative z-10 ${
          showUpgrade ? 'pb-40' : 'pb-28'
        }`}
      >
        {/* Greeting header */}
        <header className="flex items-start justify-between gap-3 pt-4 pb-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={`${appHeaderBtn} flex-shrink-0`}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-[#0E2538]/70" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold text-[#0E2538] tracking-tight text-balance">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-[#0E2538]/55 mt-0.5">
              <TranslatedText text="You're doing great today." />
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing || progressLoading}
              className={appHeaderBtn}
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-[#3F8DD2] ${isRefreshing || progressLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className={`${appHeaderBtn} overflow-hidden p-0`}
              aria-label="Profile"
            >
              <Mascot size="xs" className="w-8 h-8" />
            </button>
          </div>
        </header>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Your Progress */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`relative rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(63,141,210,0.08)] border overflow-hidden mb-5 ${
            celebrating ? 'border-[#F6B884]/70 ring-2 ring-[#F6B884]/30' : 'border-white'
          }`}
        >
          <div
            className="pointer-events-none absolute -bottom-8 -right-8 w-40 h-40 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(246,184,132,0.45) 0%, rgba(63,141,210,0.2) 50%, transparent 70%)',
            }}
            aria-hidden
          />
          {celebrating &&
            CELEBRATION_BURSTS.map((p) => (
              <motion.span
                key={p.id}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-8 w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.2 }}
                transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
              />
            ))}
          <div className="flex items-center justify-between mb-4 relative">
            <h2 className="text-base font-bold text-[#0E2538]">
              <TranslatedText text={celebrating ? 'Milestone unlocked!' : 'Your Progress'} />
            </h2>
            <button
              type="button"
              onClick={() => navigate('/progress')}
              className="text-sm font-semibold text-[#3F8DD2] hover:text-[#2A72B5] transition-colors"
            >
              <TranslatedText text="View all" />
            </button>
          </div>
          <div className="flex items-center gap-4 relative">
            <ProgressRing value={programProgress} celebrate={celebrating} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0E2538]/70 leading-snug mb-3">
                <TranslatedText
                  text={
                    celebrating
                      ? "Celebrate this win — you're building a better you."
                      : "Keep it up — you're building a better you."
                  }
                />
              </p>
              <p className="text-xs text-[#0E2538]/45 mb-3">
                Day {currentDay} of 30
              </p>
              <button
                type="button"
                onClick={() => navigate('/progress')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFF1E6] text-[#C46A2E] border border-[#F6B884]/40"
              >
                <Flame className="w-3.5 h-3.5" />
                {displayStats.currentStreakDays > 0
                  ? `${displayStats.currentStreakDays} day streak`
                  : displayStats.daysSmokeFree > 0
                    ? `${displayStats.daysSmokeFree} days earned`
                    : displayStats.checkIns > 0
                      ? `${displayStats.checkIns} check-ins`
                      : `Day ${currentDay}`}
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleContinueProgram}
            disabled={sessionLoading}
            className={`relative mt-5 w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-60 ${
              restingMs > 0 && !showUpgrade ? 'opacity-70' : ''
            }`}
            style={{ background: 'linear-gradient(90deg, #3F8DD2 0%, #6EA48F 55%, #F6B884 100%)' }}
          >
            {sessionLoading ? (
              <TranslatedText text="Loading..." />
            ) : showUpgrade ? (
              <>
                <TranslatedText text="Unlock Day 2" />
                <ArrowRight className="w-4 h-4" />
              </>
            ) : restingMs > 0 ? (
              <TranslatedText text={`Next session in ${formatUnlockWait(restingMs)}`} />
            ) : (
              <>
                <TranslatedText text={programStarted ? 'Continue Program' : 'Start Program'} />
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.section>

        {/* Today at a glance */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5"
        >
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Today at a glance" />
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <GlanceCard
              icon={Calendar}
              label="Smoke-free"
              value={displayStats.daysSmokeFree > 0 ? `${displayStats.daysSmokeFree}d` : `Day ${currentDay}`}
              sub={displayStats.daysSmokeFree > 0 && displayStats.currentStreakDays < displayStats.daysSmokeFree
                ? `${displayStats.currentStreakDays}d current streak`
                : undefined}
              tint="bg-[#E8F4FC] text-[#3F8DD2]"
            />
            <GlanceCard
              icon={Cigarette}
              label="Cigarettes avoided"
              value={String(displayStats.cigarettesNotSmoked)}
              tint="bg-[#FFF1E6] text-[#E8894A]"
            />
            <GlanceCard
              icon={Droplet}
              label="Nicotine"
              value={`${Math.round(displayStats.nicotineNotConsumed * 10) / 10}mg`}
              tint="bg-[#EAF6F1] text-[#6EA48F]"
            />
            <GlanceCard
              iconText={displayStats.currencySymbol}
              label="Saved"
              value={displayStats.moneySavedFormatted}
              tint="bg-[#F3EEF8] text-[#7B6B9B]"
            />
          </div>
          {(todayCravings > 0 || todaySlips > 0) && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {todayCravings > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Shield className="w-3 h-3 flex-shrink-0" />
                  {todayCravings} resisted
                </span>
              )}
              {todaySlips > 0 && (
                <span className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
                  <Cigarette className="w-3 h-3 flex-shrink-0" />
                  <span className="min-w-0 break-words">
                    {todaySlips} slipped · −
                    {formatSlipLoss(todaySlips, {
                      packCost: userProfile?.pack_cost,
                      country: userProfile?.country,
                    })}
                    {' · '}
                    {formatSlipNicotine(todaySlips, userProfile?.country)}
                    {' · '}
                    {formatSlipLifeLost(todaySlips)}
                  </span>
                </span>
              )}
            </div>
          )}
        </motion.section>

        {/* Coach beta entry */}
        {userProfile?.enable_coach_chat ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="mb-5"
          >
            <button
              type="button"
              onClick={() => navigate('/coach')}
              className="w-full rounded-3xl bg-white border border-[#0E2538]/06 shadow-[0_4px_16px_rgba(63,141,210,0.06)] p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
            >
              <span className="w-11 h-11 rounded-2xl bg-[#E8F4FC] text-[#3F8DD2] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#0E2538]">Talk to Coach</span>
                <span className="block text-xs text-[#0E2538]/45 mt-0.5">
                  Motivation, tough moments, or a specialist when you need one
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#0E2538]/30 shrink-0" />
            </button>
          </motion.section>
        ) : null}

        {/* Quick actions */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5"
        >
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Quick actions" />
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <QuickTile
              icon={Shield}
              label="Resisted"
              tint="bg-[#EAF6F1] text-[#6EA48F]"
              onClick={handleQuickResist}
            />
            <QuickTile
              icon={Wind}
              label="Breathe"
              tint="bg-[#E8F4FC] text-[#3F8DD2]"
              onClick={() => {
                analyticsService.trackEvent('quick_action_clicked', { action: 'breathing' }, user?.id)
                navigate('/breathing')
              }}
            />
            <QuickTile
              icon={BookOpen}
              label="Journal"
              tint="bg-[#E8F4F0] text-[#4A9B8C]"
              onClick={() => navigate('/journal')}
            />
            <QuickTile
              icon={Cigarette}
              label="Craving"
              tint="bg-[#FFF1E6] text-[#E8894A]"
              onClick={() => navigate('/craving')}
            />
          </div>
        </motion.section>

        {/* Explore banner */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden mb-4 min-h-[140px] flex flex-col justify-end p-5"
          style={{
            background: 'linear-gradient(145deg, #2A6BA8 0%, #3F8DD2 45%, #8BCDE8 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 80% 20%, #F6B884 0%, transparent 50%)',
            }}
            aria-hidden
          />
          <p className="relative text-white font-bold text-base leading-snug mb-3 max-w-[85%] text-balance">
            <TranslatedText text="Small steps today, big changes tomorrow." />
          </p>
          <button
            type="button"
            onClick={() => navigate('/sessions')}
            className="relative self-start px-4 py-2 rounded-full bg-white text-[#2A6BA8] text-sm font-bold shadow-sm active:scale-[0.98] transition-transform"
          >
            <TranslatedText text="Explore sessions" />
          </button>
        </motion.section>
      </div>

      <MilestoneModal
        isOpen={milestoneDay !== null}
        days={milestoneDay || 0}
        onClose={() => setMilestoneDay(null)}
      />
      <AchievementNotification achievement={newAchievement} onClose={dismissAchievement} />
      <KycRequiredModal isOpen={showKycModal} onClose={() => setShowKycModal(false)} />
      {showUpgrade && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[5.75rem] z-40 px-4">
          <div className="pointer-events-auto upgrade-glass-overlay max-w-md mx-auto">
            <UpgradePrompt variant="overlay" />
          </div>
        </div>
      )}
      <BottomNavigation />
    </div>
  )
}

function GlanceCard({
  icon: Icon,
  iconText,
  label,
  value,
  sub,
  tint,
}: {
  icon?: typeof Calendar
  iconText?: string
  label: string
  value: string
  sub?: string
  tint: string
}) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 ${tint}`}>
        {Icon ? <Icon className="w-4 h-4" strokeWidth={2.25} /> : (
          <span className="text-sm font-black">{iconText}</span>
        )}
      </div>
      <p className="text-[11px] font-medium text-[#0E2538]/45 mb-0.5">{label}</p>
      <p className="text-base font-bold text-[#0E2538] truncate">{value}</p>
      {sub && <p className="text-[10px] font-medium text-[#0E2538]/40 mt-0.5">{sub}</p>}
    </div>
  )
}

function QuickTile({
  icon: Icon,
  label,
  tint,
  onClick,
}: {
  icon: typeof Shield
  label: string
  tint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white active:scale-[0.96] transition-transform touch-target"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tint}`}>
        <Icon className="w-5 h-5" strokeWidth={2.25} />
      </div>
      <span className="text-[10px] font-bold text-[#0E2538]/65">{label}</span>
    </button>
  )
}
