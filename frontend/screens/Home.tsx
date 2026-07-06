import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Cigarette, Droplet, Wind, ArrowRight, Quote, RefreshCw, Shield, Plus } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import { Progress } from '../components/ui/progress'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
import MilestoneModal from '../components/MilestoneModal'
import TranslatedText from '../components/TranslatedText'
import { useApp } from '../context/AppContext'
import { useProgress } from '../hooks/useProgress'
import { cravingService } from '../services/craving.service'
import { programService } from '../services/program.service'
import { analyticsService } from '../services/analytics.service'
import { CravingType, CravingTrigger } from '../types/enums'
import { haptic, hapticPatterns } from '../utils/haptic'
import { formatMoney, getCountryConfig } from '../utils/currency'

const MILESTONE_DAYS = [3, 7, 14, 30]

const motivationalQuotes = [
  { text: "There are only three steps to quit smoking:", details: "1. Make the decision\n2. Get support\n3. Stay committed" },
  { text: "You didn't come this far to only come this far.", details: "Every day smoke-free is a victory. Keep going!" },
  { text: "The best time to quit was yesterday. The second best time is now.", details: "You're taking the right step today." },
  { text: "Progress, not perfection.", details: "Every moment you resist is progress." },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, userProfile, currentSession, sessionLoading, fetchCurrentSession } = useApp()
  const { stats, calculation, loading: progressLoading, refresh: refreshProgressData } = useProgress()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [motivationalQuote, setMotivationalQuote] = useState(motivationalQuotes[0])
  const [slipsCount, setSlipsCount] = useState(0)
  const [todayCravings, setTodayCravings] = useState(0)
  const [todaySlips, setTodaySlips] = useState(0)
  const [milestoneDay, setMilestoneDay] = useState<number | null>(null)
  const [quickLogging, setQuickLogging] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setIsRefreshing(true)
    try {
      const slipsResult = await cravingService.getCountByType(user.id, 'slip')
      setSlipsCount(slipsResult.success && slipsResult.data !== undefined ? slipsResult.data : 0)
      await refreshProgressData()
      await fetchCurrentSession()
      const today = new Date().getDate()
      setMotivationalQuote(motivationalQuotes[today % motivationalQuotes.length])

      // H4: Today's craving/slip counts — fetch all and filter client-side
      // (cravings collection may lack `created` system field)
      try {
        const allCravingsResult = await cravingService.getAll({
          filter: `user="${user.id}"`,
        })
        if (allCravingsResult.success && allCravingsResult.data) {
          const items = allCravingsResult.data
          setTodayCravings(items.filter((c: any) => c.type === 'craving').length)
          setTodaySlips(items.filter((c: any) => c.type === 'slip').length)
        }
      } catch { /* graceful fallback */ }
    } catch {
      setSlipsCount(0)
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, refreshProgressData, fetchCurrentSession])

  // H3: Check for milestone celebrations
  useEffect(() => {
    const days = calculation?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    if (days > 0) {
      const shownKey = `milestone_shown_${days}`
      const alreadyShown = sessionStorage.getItem(shownKey)
      if (!alreadyShown && MILESTONE_DAYS.includes(days)) {
        setMilestoneDay(days)
        sessionStorage.setItem(shownKey, '1')
      }
    }
  }, [calculation, stats])

  // H6: Quick log craving from home
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
      setTodayCravings(prev => prev + 1)
      analyticsService.trackCravingLogged(user.id, 'craving', 'habit')
    } catch { /* silent */ }
    setQuickLogging(false)
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
      analyticsService.trackPageView('home', user.id)
    }
  }, [user?.id, loadData])

  const displayStats = useMemo(() => {
    const daysSmokeFree = calculation?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    const moneySaved = calculation?.money_saved ?? stats?.money_saved ?? 0
    const nicotineNotConsumed = calculation?.nicotine_not_consumed ?? 0
    const cigarettesNotSmoked = calculation?.cigarettes_not_smoked ?? stats?.cigarettes_not_smoked ?? 0
    const moneySavedFormatted = formatMoney(moneySaved, userProfile?.country)
    const currencySymbol = getCountryConfig(userProfile?.country).symbol
    return { daysSmokeFree, moneySaved, moneySavedFormatted, currencySymbol, slipsCount, nicotineNotConsumed, cigarettesNotSmoked }
  }, [stats, calculation, slipsCount, userProfile?.country])

  const currentDay = currentSession?.current_day || 1
  const programProgress = Math.round((currentDay / 30) * 100)

  const handleContinueProgram = async () => {
    if (!user?.id) return
    try {
      if (currentSession && currentSession.program) {
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
  }

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5">
      {/* Pinned Top Navigation */}
      <div className="flex-shrink-0">
        <TopNavigation
          left="menu"
          center="smono"
          right={
            <button onClick={loadData} disabled={isRefreshing || progressLoading} className="p-2 rounded-full hover:bg-white/5 transition-colors touch-target">
              <RefreshCw className={`w-5 h-5 text-text-primary ${isRefreshing || progressLoading ? 'animate-spin' : ''}`} />
            </button>
          }
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin space-y-5 pb-24">
        {/* Hero Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <GlassCard className="p-4" variant="default" gradient>
            <div className="grid grid-cols-2 gap-3">
              <StatBlock icon={Calendar} value={displayStats.daysSmokeFree > 0 ? displayStats.daysSmokeFree.toString() : `Day ${currentDay}`} label={displayStats.daysSmokeFree > 0 ? "Days Smoke-Free" : "Program"} color="text-brand-primary" />
              <StatBlock icon={Cigarette} value={displayStats.cigarettesNotSmoked.toString()} label="Cigarettes Avoided" color="text-red-400" />
              <StatBlock iconText={displayStats.currencySymbol} value={displayStats.moneySavedFormatted} label="Money Saved" color="text-emerald-400" />
              <StatBlock icon={Droplet} value={`${Math.round(displayStats.nicotineNotConsumed * 10) / 10}mg`} label="Nicotine Avoided" color="text-brand-accent" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Program Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-text-primary/50 uppercase tracking-wide">30-Day Program</p>
                <p className="text-2xl font-black text-text-primary">Day {currentDay}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-brand-primary">{programProgress}%</p>
                <p className="text-xs font-medium text-text-primary/50">complete</p>
              </div>
            </div>
            <Progress value={programProgress} className="mb-4 bg-white/5 h-2" />
            <GlassButton onClick={handleContinueProgram} disabled={sessionLoading} fullWidth className="py-3.5 text-sm font-bold">
              {sessionLoading ? <TranslatedText text="Loading..." /> : <><TranslatedText text="Continue Program" /><ArrowRight className="w-4 h-4 ml-2" /></>}
            </GlassButton>
          </GlassCard>
        </motion.div>

        {/* Today's Activity Counter */}
        {(todayCravings > 0 || todaySlips > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <GlassCard className="p-4 border-white/5 bg-white/5">
              <p className="text-[10px] font-bold text-text-primary/40 mb-2.5 uppercase tracking-wider">Today</p>
              <div className="flex gap-4">
                {todayCravings > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-text-primary">{todayCravings} resisted</span>
                  </div>
                )}
                {todaySlips > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Cigarette className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-text-primary">{todaySlips} slipped</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <h3 className="text-sm font-bold text-text-primary/70 mb-3 uppercase tracking-wider px-1">
            <TranslatedText text="Quick Actions" />
          </h3>
          <div className="grid grid-cols-4 gap-2.5">
            <QuickAction
              icon={Shield}
              label="I Resisted"
              color="text-emerald-400"
              bg="bg-emerald-500/10 border-emerald-500/10 hover:bg-emerald-500/15"
              onClick={handleQuickResist}
            />
            <QuickAction
              icon={Wind}
              label="Breathe"
              color="text-brand-primary"
              bg="bg-brand-primary/10 border-brand-primary/10 hover:bg-brand-primary/15"
              onClick={() => { analyticsService.trackEvent('quick_action_clicked', { action: 'breathing' }, user?.id); navigate('/breathing') }}
            />
            <QuickAction
              icon={Cigarette}
              label="Log Slip"
              color="text-red-400"
              bg="bg-red-500/10 border-red-500/10 hover:bg-red-500/15"
              onClick={() => { analyticsService.trackEvent('quick_action_clicked', { action: 'log_slip' }, user?.id); navigate('/craving?slip=true') }}
            />
            <QuickAction
              icon={Plus}
              label="Craving"
              color="text-brand-accent"
              bg="bg-brand-accent/10 border-brand-accent/10 hover:bg-brand-accent/15"
              onClick={() => { navigate('/craving') }}
            />
          </div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <GlassCard className="p-5 border-brand-primary/10 bg-brand-primary/5">
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-primary font-bold text-sm leading-snug mb-1">{motivationalQuote.text}</p>
                <p className="text-text-primary/60 text-xs whitespace-pre-line leading-relaxed">{motivationalQuote.details}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* H3: Streak Milestone Celebration */}
      <MilestoneModal
        isOpen={milestoneDay !== null}
        days={milestoneDay || 0}
        onClose={() => setMilestoneDay(null)}
      />

      {/* Pinned Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

function StatBlock({ icon: Icon, iconText, value, label, color }: { icon?: any; iconText?: string; value: string; label: string; color: string }) {
  let bgWrapper = 'bg-white/5 border border-white/5'
  if (color.includes('brand-primary')) {
    bgWrapper = 'bg-brand-primary/15 border border-brand-primary/20'
  } else if (color.includes('red')) {
    bgWrapper = 'bg-red-500/15 border border-red-500/20'
  } else if (color.includes('emerald')) {
    bgWrapper = 'bg-emerald-500/15 border border-emerald-500/20'
  } else if (color.includes('brand-accent')) {
    bgWrapper = 'bg-brand-accent/15 border border-brand-accent/20'
  }

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5 shadow-glass-sm min-w-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bgWrapper}`}>
        {Icon ? (
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        ) : iconText ? (
          <span className={`text-sm font-black ${color} text-center`}>{iconText}</span>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="text-base font-black text-text-primary leading-tight truncate">{value}</div>
        <div className="text-[10px] font-semibold text-text-primary/45 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, color, bg, onClick }: { icon: any; label: string; color: string; bg: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-center transition-all duration-200 active:scale-[0.96] shadow-glass-sm bg-white/5 ${bg}`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-[10px] font-bold text-text-primary/70">{label}</span>
    </button>
  )
}
