import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, RefreshCw, TrendingUp } from 'lucide-react'
import Mascot from '../components/Mascot'
import SmonoLogo from '../components/SmonoLogo'
import AppHeader, { appHeaderBtn } from '../components/AppHeader'
import BottomNavigation from '../components/BottomNavigation'
import AchievementNotification from '../components/AchievementNotification'
import TranslatedText from '../components/TranslatedText'
import {
  CravingTrendChart,
  TriggerBreakdownChart,
  ChartLoadingState,
  ChartPreviewShell,
  type ChartPoint,
  type TriggerSlice,
} from '../components/progress/ProgressCharts'
import { PREVIEW_CRAVING_TREND_WEEK, PREVIEW_TRIGGER_BREAKDOWN } from '../utils/progressPreviewData'
import { useApp } from '../context/AppContext'
import { useProgress } from '../hooks/useProgress'
import { useAchievements } from '../hooks/useAchievements'
import { profileService } from '../services/profile.service'
import { analyticsService } from '../services/analytics.service'
import { beliefService, BeliefDelta } from '../services/belief.service'
import { CravingTrigger } from '../types/enums'
import { Achievement } from '../types/models'
import { formatMoney, getCountryConfig } from '../utils/currency'
import { cravingService } from '../services/craving.service'
import { daysUntilQuitDate } from '../utils/smokeFreeDays'

const HEALTH_MILESTONES = [
  { time: '20 minutes', days: 0, title: 'Heart rate normalizes', completed: (days: number) => days >= 0 },
  { time: '12 hours', days: 0.5, title: 'CO levels drop', completed: (days: number) => days >= 0.5 },
  { time: '24 hours', days: 1, title: 'Carbon monoxide levels drop', completed: (days: number) => days >= 1 },
  { time: '2 days', days: 2, title: 'Taste and smell improve', completed: (days: number) => days >= 2 },
  { time: '1 week', days: 7, title: 'Circulation improves', completed: (days: number) => days >= 7 },
  { time: '2 weeks', days: 14, title: 'Lung function improves', completed: (days: number) => days >= 14 },
  { time: '1 month', days: 30, title: 'Coughing decreases', completed: (days: number) => days >= 30 },
  { time: '3 months', days: 90, title: 'Lung capacity increases', completed: (days: number) => days >= 90 },
]

const TRIGGER_COLORS: Record<string, string> = {
  [CravingTrigger.STRESS]: '#F58634',
  [CravingTrigger.SOCIAL]: '#D45A1C',
  [CravingTrigger.BOREDOM]: '#FFD08A',
  [CravingTrigger.HABIT]: '#2A72B5',
  [CravingTrigger.OTHER]: '#9B59B6',
}

const TIME_FILTERS = [
  { id: 'week' as const, label: 'This Week' },
  { id: 'month' as const, label: 'This Month' },
  { id: 'all' as const, label: 'All Time' },
]

export default function Progress() {
  const navigate = useNavigate()
  const { user, currentSession, userProfile, progressStats } = useApp()
  const { stats, calculation, loading: progressLoading, refresh: refreshProgressData } = useProgress()
  const {
    achievements,
    isUnlocked,
    checkAndUnlock,
    loading: achievementsLoading,
    fetchUserAchievements,
  } = useAchievements()

  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week')
  const [cravingTrend, setCravingTrend] = useState<ChartPoint[]>([])
  const [triggerBreakdown, setTriggerBreakdown] = useState<TriggerSlice[]>([])
  const [chartsLoading, setChartsLoading] = useState(false)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [beliefDeltas, setBeliefDeltas] = useState<BeliefDelta[]>([])
  const [preQuitData, setPreQuitData] = useState<{
    isPreQuit: boolean
    daysUntilQuit: number
    quitDateStr: string
    totalResisted: number
    programDay: number
    programPercent: number
    moneySaved: string
    nicotineAvoided: number
  } | null>(null)

  const userCountry = userProfile?.country

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const run = async () => {
      setChartsLoading(true)
      try {
        const refreshResult = await refreshProgressData()
        const freshCalc =
          refreshResult && 'success' in refreshResult && refreshResult.success ? refreshResult.data : null

        try {
          const profileResult = await profileService.getByUserId(user.id)
          if (!cancelled && profileResult.success && profileResult.data) {
            const quitRaw = profileResult.data.quit_date
            const daysUntil = daysUntilQuitDate(quitRaw)
            if (quitRaw && daysUntil > 0) {
              const day = currentSession?.current_day || 1
              const m = String(quitRaw).match(/^(\d{4})-(\d{2})-(\d{2})/)
              const quitLocal = m
                ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
                : new Date()
              setPreQuitData({
                isPreQuit: true,
                daysUntilQuit: daysUntil,
                quitDateStr: quitLocal.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                totalResisted: freshCalc?.cigarettes_not_smoked ?? 0,
                programDay: day,
                programPercent: Math.round((day / 30) * 100),
                moneySaved: formatMoney(freshCalc?.money_saved ?? 0, profileResult.data.country),
                nicotineAvoided: Math.round((freshCalc?.nicotine_not_consumed ?? 0) * 10) / 10,
              })
            } else {
              setPreQuitData(null)
            }
          }
        } catch { /* continue */ }

        const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365
        const trendResult = await cravingService.getTrend(user.id, days)
        if (!cancelled && trendResult.success && trendResult.data) {
          const formatted = trendResult.data
            .map((item: { date: string; count: number }) => {
              try {
                const date = new Date(item.date)
                const day =
                  timeFilter === 'week'
                    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return { day, cravings: item.count, date: item.date }
              } catch {
                return { day: item.date, cravings: item.count, date: item.date }
              }
            })
            .sort((a: ChartPoint, b: ChartPoint) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
          setCravingTrend(formatted)
        } else if (!cancelled) {
          setCravingTrend([])
        }

        const breakdownResult = await cravingService.getTriggerBreakdown(user.id)
        if (!cancelled && breakdownResult.success && breakdownResult.data) {
          setTriggerBreakdown(
            breakdownResult.data.map((item: { name: string; value: number }) => ({
              name: item.name.charAt(0).toUpperCase() + item.name.slice(1).replace('_', ' '),
              value: item.value,
              color: TRIGGER_COLORS[item.name] || '#9B59B6',
            }))
          )
        } else if (!cancelled) {
          setTriggerBreakdown([])
        }

        const beliefResult = await beliefService.getBeliefDelta(user.id)
        if (!cancelled && beliefResult.success && beliefResult.data) {
          setBeliefDeltas(beliefResult.data)
        }

        const unlockResult = await checkAndUnlock()
        if (!cancelled) await fetchUserAchievements()
        if (!cancelled && unlockResult?.success && unlockResult.newlyUnlocked?.length) {
          setNewlyUnlocked(unlockResult.newlyUnlocked[0])
          setShowNotification(true)
          setTimeout(() => {
            setShowNotification(false)
            setNewlyUnlocked(null)
          }, 5000)
        }
      } catch (error) {
        console.error('Failed to load progress data:', error)
      } finally {
        if (!cancelled) setChartsLoading(false)
      }
    }

    run()
    analyticsService.trackPageView('progress', user.id)
    return () => { cancelled = true }
    // ponytail: stable deps only — refreshProgressData identity changes when stats update
  }, [user?.id, timeFilter, currentSession?.current_day])

  const handleRefresh = useCallback(async () => {
    if (!user?.id) return
    setChartsLoading(true)
    try {
      await refreshProgressData()
      const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365
      const [trendResult, breakdownResult] = await Promise.all([
        cravingService.getTrend(user.id, days),
        cravingService.getTriggerBreakdown(user.id),
      ])
      if (trendResult.success && trendResult.data) {
        setCravingTrend(
          trendResult.data
            .map((item: { date: string; count: number }) => ({
              day:
                timeFilter === 'week'
                  ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(item.date).getDay()]
                  : new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              cravings: item.count,
              date: item.date,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        )
      }
      if (breakdownResult.success && breakdownResult.data) {
        setTriggerBreakdown(
          breakdownResult.data.map((item: { name: string; value: number }) => ({
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1).replace('_', ' '),
            value: item.value,
            color: TRIGGER_COLORS[item.name] || '#9B59B6',
          }))
        )
      }
      await checkAndUnlock()
      await fetchUserAchievements()
    } finally {
      setChartsLoading(false)
    }
  }, [user?.id, timeFilter, refreshProgressData, checkAndUnlock, fetchUserAchievements])

  const healthMilestones = useMemo(() => {
    const daysSmokeFree = Math.floor(
      calculation?.days_smoke_free ?? progressStats?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    )
    return HEALTH_MILESTONES.map((milestone) => ({
      ...milestone,
      completed: milestone.completed(daysSmokeFree),
    }))
  }, [stats?.days_smoke_free, calculation?.days_smoke_free, progressStats?.days_smoke_free])

  const overallStats = useMemo(() => {
    const rawDays =
      calculation?.days_smoke_free ?? progressStats?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    const daysSmokeFree = Math.floor(rawDays)
    const currentStreakDays = Math.floor(calculation?.current_streak_days ?? 0)
    const cigarettesNotSmoked =
      calculation?.cigarettes_not_smoked ?? progressStats?.cigarettes_not_smoked ?? stats?.cigarettes_not_smoked ?? 0
    const nicotinePerCig = getCountryConfig(userCountry).nicotinePerCigarette
    const nicotineAvoided =
      calculation?.nicotine_not_consumed ?? cigarettesNotSmoked * nicotinePerCig

    return {
      daysSmokeFree,
      currentStreakDays,
      moneySaved: calculation?.money_saved ?? progressStats?.money_saved ?? stats?.money_saved ?? 0,
      cigarettesNotSmoked,
      nicotineAvoided: Math.round(nicotineAvoided * 10) / 10,
      lifeRegained: Math.round(
        calculation?.life_regained_hours ?? progressStats?.life_regained_hours ?? stats?.life_regained_hours ?? 0
      ),
      healthImprovement: Math.min(100, Math.round(daysSmokeFree * 2)),
    }
  }, [stats, calculation, progressStats, userCountry])

  const formattedAchievements = useMemo(
    () => achievements.map((a) => ({ ...a, unlocked: isUnlocked(a.key) })),
    [achievements, isUnlocked]
  )

  const isRefreshing = chartsLoading || progressLoading
  const hasCravingData = cravingTrend.length > 0
  const hasTriggerData = triggerBreakdown.length > 0
  const displayCravingTrend = hasCravingData ? cravingTrend : PREVIEW_CRAVING_TREND_WEEK
  const displayTriggerBreakdown = hasTriggerData ? triggerBreakdown : PREVIEW_TRIGGER_BREAKDOWN
  const displayTimeFilter = hasCravingData ? timeFilter : 'week'

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden relative bg-[#F4FBFF]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139, 205, 232, 0.35), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="flex-shrink-0 px-4 safe-area-top relative z-10">
        <AppHeader
          title="Progress"
          right={
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || achievementsLoading}
              className={appHeaderBtn}
              aria-label="Refresh progress"
            >
              <RefreshCw className={`w-4 h-4 text-[#3F8DD2] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          }
        />
      </div>

      {showNotification && newlyUnlocked && (
        <AchievementNotification
          achievement={newlyUnlocked}
          onClose={() => {
            setShowNotification(false)
            setNewlyUnlocked(null)
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-1 scrollbar-thin pb-28 space-y-5 relative z-10">
        {/* Time range pills */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTimeFilter(f.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-colors ${
                timeFilter === f.id
                  ? 'bg-[#E8F4FC] text-[#3F8DD2]'
                  : 'text-[#0E2538]/45 hover:text-[#0E2538]/70'
              }`}
            >
              <TranslatedText text={f.label} />
            </button>
          ))}
        </div>

        {/* Hero stats */}
        {preQuitData?.isPreQuit ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
          >
            <HeroHeader
              value={preQuitData.daysUntilQuit}
              label="Days until quit date"
              sub={`Quit date: ${preQuitData.quitDateStr}`}
            />
            <StatGrid
              items={[
                { label: 'Program', value: `Day ${preQuitData.programDay}` },
                { label: 'Cravings resisted', value: String(preQuitData.totalResisted) },
                { label: 'Money saved', value: preQuitData.moneySaved },
                { label: 'Nicotine avoided', value: `${preQuitData.nicotineAvoided}mg` },
              ]}
            />
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(63,141,210,0.08)] border border-white"
          >
            <HeroHeader
              value={overallStats.daysSmokeFree}
              label="Days smoke-free"
              sub={
                overallStats.daysSmokeFree > 0
                  ? overallStats.currentStreakDays > 0 &&
                    overallStats.currentStreakDays < overallStats.daysSmokeFree
                    ? `${overallStats.currentStreakDays} day current streak · ${overallStats.daysSmokeFree} days total earned`
                    : overallStats.currentStreakDays > 0
                      ? `${overallStats.currentStreakDays} day streak — keep going`
                      : 'Total earned from check-ins — a slip never erases this'
                  : 'Answer check-ins to build your progress'
              }
            />
            <StatGrid
              items={[
                { label: 'Money saved', value: formatMoney(overallStats.moneySaved, userCountry) },
                { label: 'Cigarettes avoided', value: String(overallStats.cigarettesNotSmoked) },
                { label: 'Nicotine avoided', value: `${overallStats.nicotineAvoided}mg` },
                { label: 'Life regained', value: `${overallStats.lifeRegained}h` },
              ]}
            />
          </motion.section>
        )}

        {/* Insights */}
        <SoftCard title="Insights">
          <WeeklyInsights
            cravingTrend={hasCravingData ? cravingTrend : PREVIEW_CRAVING_TREND_WEEK}
            achievements={formattedAchievements}
            isPreview={!hasCravingData}
            onLogCraving={() => navigate('/craving')}
          />
        </SoftCard>

        {/* Craving trend chart */}
        <SoftCard title="Craving patterns" subtitle="Daily craving logs over time">
          {chartsLoading ? (
            <ChartLoadingState />
          ) : (
            <ChartPreviewShell
              isPreview={!hasCravingData}
              ctaLabel="Log your first craving"
              onCta={() => navigate('/craving')}
            >
              <CravingTrendChart data={displayCravingTrend} variant={displayTimeFilter} />
            </ChartPreviewShell>
          )}
        </SoftCard>

        {/* Trigger breakdown */}
        <SoftCard title="Trigger breakdown" subtitle="What sets off your cravings">
          {chartsLoading ? (
            <ChartLoadingState />
          ) : (
            <ChartPreviewShell
              isPreview={!hasTriggerData}
              ctaLabel="Log a craving with trigger"
              onCta={() => navigate('/craving')}
            >
              <TriggerBreakdownChart data={displayTriggerBreakdown} />
            </ChartPreviewShell>
          )}
        </SoftCard>

        {beliefDeltas.length > 0 && (
          <SoftCard
            title="Belief change"
            subtitle="Day 0 vs latest — lower is better"
            titleIcon={<TrendingUp className="w-4 h-4 text-[#3F8DD2]" />}
          >
            <div className="space-y-3">
              {beliefDeltas.map((d) => (
                <div key={d.key}>
                  <p className="text-xs text-[#0E2538]/70 mb-1.5 truncate">{d.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#0E2538]/40 w-5 text-center">{d.day0}</span>
                    <div className="flex-1 h-2 bg-[#F4FBFF] rounded-full overflow-hidden relative border border-[#0E2538]/06">
                      <div className="absolute h-full bg-[#0E2538]/10 rounded-full" style={{ width: `${d.day0 * 10}%` }} />
                      <div
                        className={`absolute h-full rounded-full ${d.delta <= 0 ? 'bg-[#6EA48F]' : 'bg-[#D96B6B]/70'}`}
                        style={{ width: `${d.latest * 10}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#0E2538] w-5 text-center">{d.latest}</span>
                    <span className={`text-[10px] font-bold w-6 ${d.delta <= 0 ? 'text-[#6EA48F]' : 'text-[#D96B6B]'}`}>
                      {d.delta <= 0 ? '↓' : '↑'}
                      {Math.abs(d.delta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SoftCard>
        )}

        {/* Achievements */}
        <div>
          <h3 className="text-sm font-bold text-[#0E2538] mb-3 px-0.5">
            <TranslatedText text="Achievements" />
          </h3>
          {achievementsLoading && achievements.length === 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/70 animate-pulse" />
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <p className="text-center py-6 text-sm text-[#0E2538]/45">
              <TranslatedText text="No achievements available" />
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {formattedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id || achievement.key} achievement={achievement} />
              ))}
            </div>
          )}
        </div>

        {/* Health recovery */}
        <SoftCard title="Health recovery">
          <div className="space-y-2">
            {healthMilestones.map((milestone, index) => {
              const progress = milestone.completed
                ? 100
                : milestone.days > 0
                  ? Math.min(99, Math.round((overallStats.daysSmokeFree / milestone.days) * 100))
                  : 100
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-2xl ${
                    milestone.completed ? 'bg-[#EAF6F1]' : 'bg-[#F4FBFF]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      milestone.completed
                        ? 'bg-[#6EA48F]/20 text-[#6EA48F]'
                        : 'bg-white text-[#0E2538]/40 border border-[#0E2538]/08'
                    }`}
                  >
                    {milestone.completed ? '✓' : `${progress}%`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0E2538]">{milestone.title}</p>
                    <p className="text-[11px] text-[#0E2538]/45">{milestone.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </SoftCard>
      </div>

      <BottomNavigation />
    </div>
  )
}

function SoftCard({
  title,
  subtitle,
  titleIcon,
  children,
}: {
  title: string
  subtitle?: string
  titleIcon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_4px_16px_rgba(63,141,210,0.06)] border border-white">
      <h3 className="text-sm font-bold text-[#0E2538] mb-1 flex items-center gap-2">
        {titleIcon}
        <TranslatedText text={title} />
      </h3>
      {subtitle && <p className="text-xs text-[#0E2538]/45 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </section>
  )
}

function HeroHeader({ value, label, sub }: { value: number; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="w-14 h-14 rounded-full bg-[#E8F4FC] border-2 border-[#3F8DD2]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <Mascot size="sm" />
      </div>
      <div className="flex-1 text-center min-w-0">
        <div className="text-4xl font-black text-[#3F8DD2] tabular-nums leading-none mb-1">{value}</div>
        <div className="text-xs font-bold text-[#0E2538]">
          <TranslatedText text={label} />
        </div>
        <p className="text-[11px] text-[#0E2538]/45 mt-1">{sub}</p>
      </div>
      <SmonoLogo size="sm" className="flex-shrink-0 opacity-80" />
    </div>
  )
}

function StatGrid({
  items,
}: {
  items: {
    label: string
    value: string
  }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(({ label, value }) => (
        <div key={label} className="p-3.5 rounded-2xl bg-[#F4FBFF] border border-[#0E2538]/06 text-center">
          <div className="text-base font-bold text-[#0E2538] tabular-nums truncate">{value}</div>
          <div className="text-[10px] text-[#0E2538]/45 font-medium mt-0.5">
            <TranslatedText text={label} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AchievementCard({
  achievement,
}: {
  achievement: {
    icon?: string
    title: string
    description?: string
    tier?: string
    unlocked: boolean
    requirement_type?: string
    requirement_value?: number
  }
}) {
  const progressLabel = () => {
    if (achievement.unlocked) return 'Unlocked'
    const v = achievement.requirement_value
    if (!v) return 'Locked'
    switch (achievement.requirement_type) {
      case 'days_streak':
        return `${v} day${v === 1 ? '' : 's'}`
      case 'cravings_resisted':
        return `${v} resisted`
      case 'sessions_completed':
        return `${v} sessions`
      case 'journal_entries':
        return `${v} entries`
      default:
        return `${v}`
    }
  }

  return (
    <div
      className={`p-3.5 text-center h-full rounded-2xl bg-white border shadow-[0_4px_16px_rgba(63,141,210,0.06)] ${
        achievement.unlocked
          ? 'border-[#3F8DD2]/25'
          : 'border-white opacity-55'
      }`}
    >
      <span className="text-2xl leading-none block mb-2" aria-hidden>
        {achievement.icon || '🏆'}
      </span>
      <p className="text-xs font-bold text-[#0E2538] leading-snug line-clamp-2">{achievement.title}</p>
      <p
        className={`text-[10px] mt-1.5 font-semibold ${
          achievement.unlocked ? 'text-[#6EA48F]' : 'text-[#0E2538]/40'
        }`}
      >
        {progressLabel()}
      </p>
    </div>
  )
}

function WeeklyInsights({
  cravingTrend,
  achievements,
  isPreview,
  onLogCraving,
}: {
  cravingTrend: ChartPoint[]
  achievements: any[]
  isPreview?: boolean
  onLogCraving?: () => void
}) {
  const thisWeekTotal = cravingTrend.slice(-7).reduce((s, d) => s + (d.cravings || 0), 0)
  const lastWeekTotal = cravingTrend.slice(-14, -7).reduce((s, d) => s + (d.cravings || 0), 0)
  const diff = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0
  const nextAchievement = achievements.find((a) => !a.unlocked)

  if (cravingTrend.length === 0 && !nextAchievement) {
    return (
      <p className="text-sm text-[#0E2538]/45 text-center py-2">Log cravings to see insights here</p>
    )
  }

  return (
    <div className="space-y-2">
      {cravingTrend.length >= 2 && (
        <div
          className={`flex items-center justify-between p-3 rounded-2xl bg-[#F4FBFF] ${isPreview ? 'opacity-50' : ''}`}
        >
          <span className="text-sm text-[#0E2538]/65">
            {isPreview ? 'Recent cravings (sample)' : 'Recent cravings'}
          </span>
          <span className="text-sm font-bold text-[#0E2538] tabular-nums">
            {thisWeekTotal}
            {(diff !== 0 && lastWeekTotal > 0) || isPreview ? (
              <span className={`ml-1 text-xs ${diff < 0 || isPreview ? 'text-[#6EA48F]' : 'text-[#D96B6B]'}`}>
                ({isPreview ? '-43%' : `${diff > 0 ? '+' : ''}${diff}%`})
              </span>
            ) : null}
          </span>
        </div>
      )}
      {isPreview && onLogCraving && (
        <button
          type="button"
          onClick={onLogCraving}
          className="w-full p-3 rounded-2xl border border-dashed border-[#3F8DD2]/35 text-sm font-semibold text-[#3F8DD2] active:scale-[0.99] transition-transform"
        >
          Log a craving to unlock your insights
        </button>
      )}
      {nextAchievement && (
        <div className="p-3 rounded-2xl bg-[#F4FBFF]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-[#0E2538]/65 truncate pr-2">Next: {nextAchievement.title}</span>
            <Trophy className="w-4 h-4 text-[#3F8DD2] flex-shrink-0" />
          </div>
          <div className="h-1.5 bg-white rounded-full overflow-hidden border border-[#0E2538]/06">
            <div className="h-full bg-[#3F8DD2] rounded-full w-2/5" />
          </div>
        </div>
      )}
    </div>
  )
}
