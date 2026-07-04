import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Cigarette, DollarSign, Droplet, Wind, ArrowRight, Quote, RefreshCw, Shield, Plus } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
import MilestoneModal from '../components/MilestoneModal'
import TranslatedText from '../components/TranslatedText'
import { useApp } from '../context/AppContext'
import { useProgress } from '../hooks/useProgress'
import { useSessions } from '../hooks/useSessions'
import { cravingService } from '../services/craving.service'
import { programService } from '../services/program.service'
import { analyticsService } from '../services/analytics.service'
import { CravingType, CravingTrigger } from '../types/enums'
import { haptic, hapticPatterns } from '../utils/haptic'

const MILESTONE_DAYS = [3, 7, 14, 30]

const motivationalQuotes = [
  { text: "There are only three steps to quit smoking:", details: "1. Make the decision\n2. Get support\n3. Stay committed" },
  { text: "You didn't come this far to only come this far.", details: "Every day smoke-free is a victory. Keep going!" },
  { text: "The best time to quit was yesterday. The second best time is now.", details: "You're taking the right step today." },
  { text: "Progress, not perfection.", details: "Every moment you resist is progress." },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useApp()
  const { stats, calculation, loading: progressLoading, refresh: refreshProgressData } = useProgress()
  const { currentSession, loading: sessionLoading, fetchCurrentSession } = useSessions()
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

      // H4: Today's craving/slip counts
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const todayCravingsResult = await cravingService.getAll({
        filter: `user="${user.id}" && created>="${todayStart.toISOString()}"`,
      })
      if (todayCravingsResult.success && todayCravingsResult.data) {
        const items = todayCravingsResult.data
        setTodayCravings(items.filter((c: any) => c.type === 'craving').length)
        setTodaySlips(items.filter((c: any) => c.type === 'slip').length)
      }
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
    return { daysSmokeFree, moneySaved, slipsCount, nicotineNotConsumed }
  }, [stats, calculation, slipsCount])

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
    <div className="min-h-screen min-h-[100dvh] pb-24 bg-background">
      <TopNavigation
        left="menu"
        center="smono"
        right={
          <button onClick={loadData} disabled={isRefreshing || progressLoading} className="p-2 rounded-full hover:bg-muted transition-colors touch-target">
            <RefreshCw className={`w-5 h-5 text-foreground ${isRefreshing || progressLoading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="app-container px-3 sm:px-4 pt-4 sm:pt-6 pb-8 space-y-4 sm:space-y-5">
        {/* Hero Stats — inspired by smono prototype stat counters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <StatBlock icon={Calendar} value={displayStats.daysSmokeFree.toString()} label="Days Tracked" color="text-info" />
                <StatBlock icon={Cigarette} value={displayStats.slipsCount.toString()} label="Cigarettes" color="text-destructive" />
                <StatBlock icon={DollarSign} value={`₹${Math.round(displayStats.moneySaved)}`} label="Money Saved" color="text-success" />
                <StatBlock icon={Droplet} value={`${Math.round(displayStats.nicotineNotConsumed)}mg`} label="Nicotine Avoided" color="text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Program Progress — inspired by smono's day progress tracker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">30-Day Program</p>
                  <p className="text-2xl font-bold text-foreground">Day {currentDay}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{programProgress}%</p>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              </div>
              <Progress value={programProgress} className="mb-4" />
              <Button onClick={handleContinueProgram} disabled={sessionLoading} className="w-full" size="lg">
                {sessionLoading ? <TranslatedText text="Loading..." /> : <><TranslatedText text="Continue Program" /><ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* H4: Today's Activity Counter */}
        {(todayCravings > 0 || todaySlips > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <Card className="border-muted">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Today</p>
                <div className="flex gap-4">
                  {todayCravings > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-success" />
                      <span className="text-sm font-semibold text-foreground">{todayCravings} resisted</span>
                    </div>
                  )}
                  {todaySlips > 0 && (
                    <div className="flex items-center gap-2">
                      <Cigarette className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-semibold text-foreground">{todaySlips} slipped</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <h3 className="text-base font-semibold text-foreground mb-3">
            <TranslatedText text="Quick Actions" />
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <QuickAction
              icon={Shield}
              label="I Resisted"
              color="text-success"
              bg="bg-success/10"
              onClick={handleQuickResist}
            />
            <QuickAction
              icon={Wind}
              label="Breathe"
              color="text-info"
              bg="bg-info/10"
              onClick={() => { analyticsService.trackEvent('quick_action_clicked', { action: 'breathing' }, user?.id); navigate('/breathing') }}
            />
            <QuickAction
              icon={Cigarette}
              label="Log Slip"
              color="text-destructive"
              bg="bg-destructive/10"
              onClick={() => { analyticsService.trackEvent('quick_action_clicked', { action: 'log_slip' }, user?.id); navigate('/craving?slip=true') }}
            />
            <QuickAction
              icon={Plus}
              label="Craving"
              color="text-primary"
              bg="bg-primary/10"
              onClick={() => { navigate('/craving') }}
            />
          </div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground font-medium text-[15px] leading-snug mb-1">{motivationalQuote.text}</p>
                  <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">{motivationalQuote.details}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* H3: Streak Milestone Celebration */}
      <MilestoneModal
        isOpen={milestoneDay !== null}
        days={milestoneDay || 0}
        onClose={() => setMilestoneDay(null)}
      />

      <BottomNavigation />
    </div>
  )
}

function StatBlock({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
      <div className="min-w-0">
        <div className="text-lg font-bold text-foreground leading-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, color, bg, onClick }: { icon: any; label: string; color: string; bg: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 p-4 rounded-lg ${bg} hover:opacity-80 transition-opacity active:scale-95`}>
      <Icon className={`w-6 h-6 ${color}`} />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  )
}
