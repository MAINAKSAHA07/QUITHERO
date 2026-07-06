import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, DollarSign, Cigarette, Clock, TrendingUp, RefreshCw, Shield, Target } from 'lucide-react'
import Mascot from '../components/Mascot'
import SmonoLogo from '../components/SmonoLogo'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
import GlassCard from '../components/GlassCard'
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
            const quitDate = profileResult.data.quit_date ? new Date(profileResult.data.quit_date) : null
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (quitDate && quitDate.getTime() > today.getTime()) {
              const daysUntil = Math.ceil((quitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const day = currentSession?.current_day || 1
              setPreQuitData({
                isPreQuit: true,
                daysUntilQuit: daysUntil,
                quitDateStr: quitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
    const daysSmokeFree =
      calculation?.days_smoke_free ?? progressStats?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    return HEALTH_MILESTONES.map((milestone) => ({
      ...milestone,
      completed: milestone.completed(daysSmokeFree),
    }))
  }, [stats?.days_smoke_free, calculation?.days_smoke_free, progressStats?.days_smoke_free])

  const overallStats = useMemo(() => {
    const daysSmokeFree =
      calculation?.days_smoke_free ?? progressStats?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    const cigarettesNotSmoked =
      calculation?.cigarettes_not_smoked ?? progressStats?.cigarettes_not_smoked ?? stats?.cigarettes_not_smoked ?? 0
    const nicotinePerCig = getCountryConfig(userCountry).nicotinePerCigarette
    const nicotineAvoided =
      calculation?.nicotine_not_consumed ?? cigarettesNotSmoked * nicotinePerCig

    return {
      daysSmokeFree,
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
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5">
      <div className="flex-shrink-0">
        <TopNavigation
          left="menu"
          center="Your Progress"
          right={
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || achievementsLoading}
              className="p-2 rounded-full hover:bg-white/5 transition-colors touch-target"
              aria-label="Refresh progress"
            >
              <RefreshCw className={`w-5 h-5 text-text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
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

      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin pb-24 space-y-5">
        {/* Time range pills */}
        <div className="flex gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04]">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTimeFilter(f.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
                timeFilter === f.id
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-text-primary/55 hover:text-text-primary/80'
              }`}
            >
              <TranslatedText text={f.label} />
            </button>
          ))}
        </div>

        {/* Hero stats */}
        {preQuitData?.isPreQuit ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-5 bg-gradient-to-br from-brand-primary/10 to-brand-accent/8">
              <HeroHeader
                value={preQuitData.daysUntilQuit}
                label="DAYS UNTIL QUIT DATE"
                sub={`Quit date: ${preQuitData.quitDateStr}`}
              />
              <StatGrid
                items={[
                  { icon: Target, label: 'Program', value: `Day ${preQuitData.programDay}` },
                  { icon: Shield, label: 'Cravings resisted', value: String(preQuitData.totalResisted) },
                  { icon: DollarSign, label: 'Money saved', value: preQuitData.moneySaved },
                  { icon: TrendingUp, label: 'Nicotine avoided', value: `${preQuitData.nicotineAvoided}mg` },
                ]}
              />
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-5 bg-gradient-to-br from-brand-primary/10 to-brand-accent/8">
              <HeroHeader
                value={overallStats.daysSmokeFree}
                label="DAYS SMOKE-FREE"
                sub={overallStats.daysSmokeFree > 0 ? 'Keep the streak going' : 'Your journey starts here'}
              />
              <StatGrid
                items={[
                  { icon: DollarSign, label: 'Money saved', value: formatMoney(overallStats.moneySaved, userCountry) },
                  { icon: Cigarette, label: 'Not smoked', value: String(overallStats.cigarettesNotSmoked) },
                  { icon: TrendingUp, label: 'Nicotine avoided', value: `${overallStats.nicotineAvoided}mg` },
                  { icon: Clock, label: 'Life regained', value: `${overallStats.lifeRegained}h` },
                ]}
              />
            </GlassCard>
          </motion.div>
        )}

        {/* Insights */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">
            <TranslatedText text="Insights" />
          </h3>
          <WeeklyInsights
            cravingTrend={hasCravingData ? cravingTrend : PREVIEW_CRAVING_TREND_WEEK}
            achievements={formattedAchievements}
            isPreview={!hasCravingData}
            onLogCraving={() => navigate('/craving')}
          />
        </GlassCard>

        {/* Craving trend chart */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">
            <TranslatedText text="Craving Patterns" />
          </h3>
          <p className="text-xs text-text-primary/50 mb-4">Daily craving logs over time</p>
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
        </GlassCard>

        {/* Trigger breakdown */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">
            <TranslatedText text="Trigger Breakdown" />
          </h3>
          <p className="text-xs text-text-primary/50 mb-4">What sets off your cravings</p>
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
        </GlassCard>

        {/* Belief change — was outside scroll area */}
        {beliefDeltas.length > 0 && (
          <GlassCard className="p-5">
            <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              Belief Change
            </h3>
            <p className="text-xs text-text-primary/50 mb-4">Day 0 vs latest — lower is better</p>
            <div className="space-y-3">
              {beliefDeltas.map((d) => (
                <div key={d.key}>
                  <p className="text-xs text-text-primary/80 mb-1.5 truncate">{d.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-primary/45 w-5 text-center">{d.day0}</span>
                    <div className="flex-1 h-2 bg-black/[0.06] rounded-full overflow-hidden relative">
                      <div className="absolute h-full bg-black/10 rounded-full" style={{ width: `${d.day0 * 10}%` }} />
                      <div
                        className={`absolute h-full rounded-full ${d.delta <= 0 ? 'bg-emerald-500' : 'bg-red-400/70'}`}
                        style={{ width: `${d.latest * 10}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-text-primary w-5 text-center">{d.latest}</span>
                    <span className={`text-[10px] font-bold w-6 ${d.delta <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {d.delta <= 0 ? '↓' : '↑'}{Math.abs(d.delta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Achievements — grid layout; BorderGlow in flex-row collapses to thin bars */}
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide px-1">
            <TranslatedText text="Achievements" />
          </h3>
          {achievementsLoading && achievements.length === 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-black/[0.04] animate-pulse" />
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <p className="text-center py-6 text-sm text-text-primary/50">
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
        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wide">
            <TranslatedText text="Health Recovery" />
          </h3>
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
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    milestone.completed ? 'bg-emerald-500/8' : 'bg-black/[0.03]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      milestone.completed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-black/[0.06] text-text-primary/45'
                    }`}
                  >
                    {milestone.completed ? '✓' : `${progress}%`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{milestone.title}</p>
                    <p className="text-[11px] text-text-primary/50">{milestone.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>

      <BottomNavigation />
    </div>
  )
}

function HeroHeader({ value, label, sub }: { value: number; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <Mascot size="md" className="flex-shrink-0" />
      <div className="flex-1 text-center">
        <div className="text-4xl font-black text-brand-primary tabular-nums leading-none mb-1">{value}</div>
        <div className="text-xs font-bold text-text-primary uppercase tracking-wider">
          <TranslatedText text={label} />
        </div>
        <p className="text-[11px] text-text-primary/55 mt-1">{sub}</p>
      </div>
      <SmonoLogo size="sm" className="flex-shrink-0 opacity-80" />
    </div>
  )
}

function StatGrid({
  items,
}: {
  items: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="p-3 rounded-xl bg-white/50 border border-black/[0.04] text-center">
          <Icon className="w-5 h-5 text-brand-primary mx-auto mb-1.5" />
          <div className="text-base font-bold text-text-primary tabular-nums truncate">{value}</div>
          <div className="text-[10px] text-text-primary/55 uppercase tracking-wide">
            <TranslatedText text={label} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: { icon?: string; title: string; description?: string; tier?: string; unlocked: boolean; requirement_type?: string; requirement_value?: number } }) {
  const tierRing =
    achievement.tier === 'platinum'
      ? 'ring-purple-400/40'
      : achievement.tier === 'gold'
      ? 'ring-amber-400/40'
      : achievement.tier === 'silver'
      ? 'ring-slate-400/30'
      : 'ring-orange-400/25'

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
    <GlassCard
      borderGlow={false}
      variant="subtle"
      className={`p-3.5 text-center h-full ${achievement.unlocked ? `ring-2 ${tierRing}` : 'opacity-55'}`}
    >
      <span className="text-2xl leading-none block mb-2" aria-hidden>
        {achievement.icon || '🏆'}
      </span>
      <p className="text-xs font-bold text-text-primary leading-snug line-clamp-2">{achievement.title}</p>
      <p className={`text-[10px] mt-1.5 font-semibold ${achievement.unlocked ? 'text-emerald-600' : 'text-text-primary/45'}`}>
        {progressLabel()}
      </p>
    </GlassCard>
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
    return <p className="text-sm text-text-primary/50 text-center py-2">Log cravings to see insights here</p>
  }

  return (
    <div className="space-y-2">
      {cravingTrend.length >= 2 && (
        <div
          className={`flex items-center justify-between p-3 rounded-xl bg-black/[0.03] ${isPreview ? 'opacity-50' : ''}`}
        >
          <span className="text-sm text-text-primary/75">
            {isPreview ? 'Recent cravings (sample)' : 'Recent cravings'}
          </span>
          <span className="text-sm font-bold text-text-primary tabular-nums">
            {thisWeekTotal}
            {(diff !== 0 && lastWeekTotal > 0) || isPreview ? (
              <span className={`ml-1 text-xs ${diff < 0 || isPreview ? 'text-emerald-600' : 'text-red-500'}`}>
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
          className="w-full p-3 rounded-xl border border-dashed border-brand-primary/30 text-sm font-semibold text-brand-primary active:scale-[0.99] transition-transform"
        >
          Log a craving to unlock your insights
        </button>
      )}
      {nextAchievement && (
        <div className="p-3 rounded-xl bg-black/[0.03]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-text-primary/75 truncate pr-2">Next: {nextAchievement.title}</span>
            <Trophy className="w-4 h-4 text-brand-primary flex-shrink-0" />
          </div>
          <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-brand-primary rounded-full w-2/5" />
          </div>
        </div>
      )}
    </div>
  )
}
