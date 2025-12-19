import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Cigarette, DollarSign, Droplet, FileText, Wind, ArrowRight, Syringe, RefreshCw } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import TranslatedText from '../components/TranslatedText'
import { useApp } from '../context/AppContext'
import { useProgress } from '../hooks/useProgress'
import { useSessions } from '../hooks/useSessions'
import { cravingService } from '../services/craving.service'
import { programService } from '../services/program.service'
import { analyticsService } from '../services/analytics.service'
import { contentService } from '../services/content.service'

// Motivational quotes (will be replaced with content service later)
const motivationalQuotes = [
  {
    text: "There are only three steps to quit smoking:",
    details: "1. Make the decision\n2. Get support\n3. Stay committed",
  },
  {
    text: "You didn't come this far to only come this far.",
    details: "Every day smoke-free is a victory. Keep going!",
  },
  {
    text: "The best time to quit was yesterday. The second best time is now.",
    details: "You're taking the right step today.",
  },
  {
    text: "Progress, not perfection.",
    details: "Every moment you resist is progress.",
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, refreshProgress } = useApp()
  const { stats, calculation, loading: progressLoading, refresh: refreshProgressData } = useProgress()
  const { currentSession, programDays, loading: sessionLoading, fetchCurrentSession } = useSessions()
  
  // Memoize loadData to avoid recreating it on every render
  const loadDataRef = useRef<() => Promise<void>>()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [motivationalQuote, setMotivationalQuote] = useState(motivationalQuotes[0])
  const [slipsCount, setSlipsCount] = useState(0)

  // Load all data - wrap in useCallback to memoize
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setIsRefreshing(true)
    try {
      // Calculate and refresh progress (this updates both stats and calculation)
      // This fetches from progress_stats collection and calculates based on quit_date
      // Will return default values (0) if quit_date is not set
      const progressResult = await refreshProgressData()
      if (progressResult.success && progressResult.data) {
        console.log('✅ Progress refreshed successfully:', {
          days_smoke_free: progressResult.data.days_smoke_free,
          money_saved: progressResult.data.money_saved,
          cigarettes_not_smoked: progressResult.data.cigarettes_not_smoked,
          cigarettes_smoked: progressResult.data.cigarettes_smoked,
          nicotine_not_consumed: progressResult.data.nicotine_not_consumed
        })
      } else {
        // Progress calculation failed, but we'll use fallback values from stats
        console.warn('⚠️ Progress calculation returned defaults or failed:', progressResult.error)
      }
      
      // Fetch current session from user_sessions collection
      await fetchCurrentSession()

      // Fetch slips count from cravings collection (type = 'slip')
      // Will return 0 if there's an error or no data
      const slipsResult = await cravingService.getCountByType(user.id, 'slip')
      if (slipsResult.success && slipsResult.data !== undefined) {
        console.log('✅ Slips count fetched:', slipsResult.data)
        setSlipsCount(slipsResult.data)
      } else {
        console.warn('⚠️ Failed to fetch slips count:', slipsResult.error)
        // Fallback to 0 if fetch fails
        setSlipsCount(0)
      }

      // Set random motivational quote (rotate daily)
      const today = new Date().getDate()
      const quoteIndex = today % motivationalQuotes.length
      setMotivationalQuote(motivationalQuotes[quoteIndex])
    } catch (error) {
      console.error('❌ Failed to load home data:', error)
      // Set defaults on error
      setSlipsCount(0)
    } finally {
      setIsRefreshing(false)
    }
  }, [user?.id, refreshProgressData, fetchCurrentSession])

  // Store loadData in ref for focus listener
  useEffect(() => {
    loadDataRef.current = loadData
  }, [loadData])

  // Fetch initial data on mount
  useEffect(() => {
    if (user?.id) {
      loadData()
      // Track page view
      analyticsService.trackPageView('home', user.id)
    }
  }, [user?.id, loadData])

  // Refresh data when page comes into focus (user navigates back)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && loadDataRef.current) {
        loadDataRef.current()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user?.id])

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Format stats for display - labels will be translated in the component
  // Use calculation first (most up-to-date), then stats, then fallback to 0
  // Make it reactive with useMemo so it updates when data changes
  const displayStats = useMemo(() => {
    // Prioritize calculation (most recent) over stats (cached)
    const daysSmokeFree = calculation?.days_smoke_free ?? stats?.days_smoke_free ?? 0
    const moneySaved = calculation?.money_saved ?? stats?.money_saved ?? 0
    const cigarettesNotSmoked = calculation?.cigarettes_not_smoked ?? stats?.cigarettes_not_smoked ?? 0
    const nicotineNotConsumed = calculation?.nicotine_not_consumed ?? 0
    
    // Debug logging
    console.log('📊 Display stats calculated:', {
      daysSmokeFree,
      moneySaved,
      cigarettesNotSmoked,
      nicotineNotConsumed,
      slipsCount,
      hasCalculation: !!calculation,
      hasStats: !!stats
    })
    
    return [
      {
        icon: Calendar,
        value: daysSmokeFree.toString(),
        label: 'days tracked',
        color: 'text-info',
      },
      {
        icon: Cigarette,
        value: slipsCount.toString(),
        label: 'cigarettes smoked',
        color: 'text-info',
      },
      {
        icon: DollarSign,
        value: `₹${Math.round(moneySaved)}`,
        label: 'money saved',
        color: 'text-brand-primary',
      },
      {
        icon: Droplet,
        value: `${Math.round(nicotineNotConsumed)}mg`,
        label: 'nicotine avoided',
        color: 'text-info',
      },
    ]
  }, [stats, calculation, slipsCount])

  // Quick Actions
  const quickActions = [
    {
      icon: FileText,
      title: 'Article of the Day',
      gradient: 'from-info/20 to-info/30',
      color: 'text-info',
      onClick: async () => {
        analyticsService.trackEvent('quick_action_clicked', { action: 'article_of_day' }, user?.id)
        const result = await contentService.getArticleOfTheDay()
        if (result.success && result.data) {
          // TODO: Navigate to article viewer when implemented
          alert(result.data.title || 'Article of the Day')
        } else {
          alert('Article feature coming soon!')
        }
      },
    },
    {
      icon: Wind,
      title: '5-5-5 Breathing',
      gradient: 'from-success/20 to-success/30',
      color: 'text-success',
      onClick: () => {
        analyticsService.trackEvent('quick_action_clicked', { action: 'breathing' }, user?.id)
        navigate('/breathing')
      },
    },
    {
      icon: Cigarette,
      title: 'Log a Slip',
      gradient: 'from-error/20 to-error/30',
      color: 'text-error',
      onClick: () => {
        analyticsService.trackEvent('quick_action_clicked', { action: 'log_slip' }, user?.id)
        navigate('/craving?slip=true')
      },
    },
  ]

  // Handle Continue Program button
  const handleContinueProgram = async () => {
    if (!user?.id) return

    try {
      // Get current session
      if (currentSession && currentSession.program) {
        const programId = typeof currentSession.program === 'string' 
          ? currentSession.program 
          : (currentSession.program as any)?.id || currentSession.program

        // Get current day
        const currentDay = currentSession.current_day || 1

        // Get program day for current day
        const dayResult = await programService.getProgramDayByNumber(programId, currentDay)
        
        if (dayResult.success && dayResult.data) {
          // Navigate to session detail
          navigate(`/sessions/${dayResult.data.id}`)
          analyticsService.trackEvent('continue_program_clicked', { day: currentDay }, user.id)
        } else {
          // If no day found, navigate to sessions list
          navigate('/sessions')
        }
      } else {
        // No session yet, navigate to sessions list
        navigate('/sessions')
      }
    } catch (error) {
      console.error('Failed to continue program:', error)
      navigate('/sessions')
    }
  }

  // Set up auto-refresh every 30 minutes
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      refreshProgressData()
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [user?.id, refreshProgressData])

  return (
    <div className="min-h-screen pb-24">
      <TopNavigation
        left="menu"
        center="Track and crack"
        right={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || progressLoading}
            className="p-2"
          >
            <RefreshCw
              className={`w-5 h-5 text-text-primary ${
                isRefreshing || progressLoading ? 'animate-spin' : ''
              }`}
            />
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* Hero Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-6 mb-6 bg-gradient-to-br from-white/15 to-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                <TranslatedText text="Since you joined" />
              </h2>
              {(isRefreshing || progressLoading) && (
                <RefreshCw className="w-4 h-4 text-text-primary/50 animate-spin" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {displayStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-subtle p-4 rounded-xl"
                  >
                    <Icon className={`w-6 h-6 ${stat.color} mb-2`} />
                    <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                    <div className="text-xs text-text-primary/70">
                      <TranslatedText text={stat.label} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === 0 ? 'bg-brand-primary' : 'bg-text-primary/30'
                  }`}
                />
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            <TranslatedText text="Quick Actions" />
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <GlassCard
                  key={index}
                  hover
                  gradient
                  onClick={action.onClick}
                  className={`p-5 min-w-[160px] bg-gradient-to-br ${action.gradient} cursor-pointer transition-transform hover:scale-105`}
                >
                  <Icon className={`w-8 h-8 ${action.color} mb-3`} />
                  <div className="text-sm font-medium text-text-primary mb-2">
                    <TranslatedText text={action.title} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-primary/50" />
                </GlassCard>
              )
            })}
          </div>
        </motion.div>

        {/* Motivational Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <GlassCard className="p-6 bg-gradient-to-br from-info/10 to-info/5">
            <div className="flex items-start gap-4">
              <Syringe className="w-8 h-8 text-error flex-shrink-0" />
              <div>
                <p className="text-text-primary font-medium mb-2">
                  {motivationalQuote.text}
                </p>
                <p className="text-text-primary/70 text-sm whitespace-pre-line">
                  {motivationalQuote.details}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassButton
            fullWidth
            onClick={handleContinueProgram}
            disabled={sessionLoading}
            className="py-4 text-lg bg-gradient-to-r from-info to-info/80"
          >
            {sessionLoading ? (
              <TranslatedText text="Loading..." />
            ) : (
              <TranslatedText text="Continue Program" />
            )}
          </GlassButton>
        </motion.div>
      </div>

      <BottomNavigation />
    </div>
  )
}

