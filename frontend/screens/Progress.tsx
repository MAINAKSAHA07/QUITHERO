import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, DollarSign, Cigarette, Clock, TrendingUp, RefreshCw } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import BottomNavigation from '../components/BottomNavigation'
import GlassCard from '../components/GlassCard'
import AchievementNotification from '../components/AchievementNotification'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useApp } from '../context/AppContext'
import { useProgress } from '../hooks/useProgress'
import { useCravings } from '../hooks/useCravings'
import { useAchievements } from '../hooks/useAchievements'
import { analyticsService } from '../services/analytics.service'
import { CravingTrigger } from '../types/enums'
import { Achievement } from '../types/models'

// Health milestones configuration
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

// Trigger colors mapping
const TRIGGER_COLORS: Record<string, string> = {
  [CravingTrigger.STRESS]: '#F58634',
  [CravingTrigger.SOCIAL]: '#D45A1C',
  [CravingTrigger.BOREDOM]: '#FFD08A',
  [CravingTrigger.HABIT]: '#2A72B5',
  [CravingTrigger.OTHER]: '#9B59B6',
}

export default function Progress() {
  const { user } = useApp()
  const { stats, calculation, loading: progressLoading, refresh: refreshProgressData } = useProgress()
  const { getTrend, getTriggerBreakdown } = useCravings()
  const { achievements, isUnlocked, checkAndUnlock } = useAchievements()
  
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week')
  const [cravingTrend, setCravingTrend] = useState<any[]>([])
  const [triggerBreakdown, setTriggerBreakdown] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadData()
      analyticsService.trackPageView('progress', user.id)
    }
  }, [user?.id, timeFilter])

  const loadData = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      // Refresh progress
      await refreshProgressData()

      // Get craving trend
      const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365
      const trendResult = await getTrend(days)
      if (trendResult.success && 'data' in trendResult && trendResult.data) {
        // Format data for chart (convert dates to day names for week, or keep dates for month/all)
        const formatted = trendResult.data.map((item: any) => {
          try {
            const date = new Date(item.date)
            if (timeFilter === 'week') {
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              return { day: dayNames[date.getDay()], cravings: item.count, date: item.date }
            } else {
              return { day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cravings: item.count, date: item.date }
            }
          } catch {
            return { day: item.date, cravings: item.count, date: item.date }
          }
        })
        // Sort by date
        formatted.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setCravingTrend(formatted)
      } else {
        setCravingTrend([])
      }

      // Get trigger breakdown
      const breakdownResult = await getTriggerBreakdown()
      if (breakdownResult.success && 'data' in breakdownResult && breakdownResult.data) {
        const formatted = breakdownResult.data.map((item: any) => ({
          name: item.name.charAt(0).toUpperCase() + item.name.slice(1).replace('_', ' '),
          value: item.value,
          color: TRIGGER_COLORS[item.name] || '#9B59B6',
        }))
        setTriggerBreakdown(formatted)
      }

      // Check for new achievements
      const unlockResult = await checkAndUnlock()
      if (unlockResult.success && unlockResult.newlyUnlocked && unlockResult.newlyUnlocked.length > 0) {
        setNewlyUnlocked(unlockResult.newlyUnlocked[0])
        setShowNotification(true)
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowNotification(false)
          setNewlyUnlocked(null)
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to load progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate health milestones
  const healthMilestones = useMemo(() => {
    const daysSmokeFree = stats?.days_smoke_free || calculation?.days_smoke_free || 0
    return HEALTH_MILESTONES.map((milestone) => ({
      ...milestone,
      completed: milestone.completed(daysSmokeFree),
    }))
  }, [stats?.days_smoke_free, calculation?.days_smoke_free])

  // Get overall stats
  const overallStats = useMemo(() => {
    return {
      daysSmokeFree: stats?.days_smoke_free || calculation?.days_smoke_free || 0,
      moneySaved: Math.round(stats?.money_saved || calculation?.money_saved || 0),
      cigarettesNotSmoked: Math.round(stats?.cigarettes_not_smoked || calculation?.cigarettes_not_smoked || 0),
      lifeRegained: Math.round((stats?.life_regained_hours || calculation?.life_regained_hours || 0)),
      healthImprovement: Math.min(100, Math.round((stats?.days_smoke_free || calculation?.days_smoke_free || 0) * 2)),
    }
  }, [stats, calculation])

  // Format achievements with unlock status
  const formattedAchievements = useMemo(() => {
    return achievements.map((achievement) => ({
      ...achievement,
      unlocked: isUnlocked(achievement.key),
    }))
  }, [achievements, isUnlocked])

  return (
    <div className="min-h-screen pb-24">
      <TopNavigation
        left="menu"
        center="Your Progress"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading || progressLoading}
              className="p-2"
            >
              <RefreshCw
                className={`w-5 h-5 text-text-primary ${
                  loading || progressLoading ? 'animate-spin' : ''
                }`}
              />
            </button>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'week' | 'month' | 'all')}
              className="glass-input text-sm py-1 px-2"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        }
      />

      {/* Achievement Notification */}
      {showNotification && newlyUnlocked && (
        <AchievementNotification
          achievement={newlyUnlocked}
          onClose={() => {
            setShowNotification(false)
            setNewlyUnlocked(null)
          }}
        />
      )}

      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        {/* Overall Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6 mb-6 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-brand-primary mb-2">
                {overallStats.daysSmokeFree}
              </div>
              <div className="text-lg font-semibold text-text-primary mb-1">
                DAYS SMOKE-FREE
              </div>
              <Trophy className="w-8 h-8 text-brand-primary mx-auto" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-subtle p-4 rounded-xl text-center">
                <DollarSign className="w-6 h-6 text-brand-primary mx-auto mb-2" />
                <div className="text-xl font-bold text-text-primary">
                  ₹{overallStats.moneySaved}
                </div>
                <div className="text-xs text-text-primary/70">Money saved</div>
              </div>
              <div className="glass-subtle p-4 rounded-xl text-center">
                <Cigarette className="w-6 h-6 text-info mx-auto mb-2" />
                <div className="text-xl font-bold text-text-primary">
                  {overallStats.cigarettesNotSmoked}
                </div>
                <div className="text-xs text-text-primary/70">Not smoked</div>
              </div>
              <div className="glass-subtle p-4 rounded-xl text-center">
                <Clock className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-xl font-bold text-text-primary">
                  {overallStats.lifeRegained}h
                </div>
                <div className="text-xs text-text-primary/70">Life regained</div>
              </div>
              <div className="glass-subtle p-4 rounded-xl text-center">
                <TrendingUp className="w-6 h-6 text-info mx-auto mb-2" />
                <div className="text-xl font-bold text-text-primary">
                  +{overallStats.healthImprovement}%
                </div>
                <div className="text-xs text-text-primary/70">Lung capacity</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Craving Patterns Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Craving Patterns
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : cravingTrend.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-text-primary/50">
                <p>No craving data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                {timeFilter === 'week' ? (
                  <BarChart data={cravingTrend}>
                    <XAxis dataKey="day" tick={{ fill: '#2B2B2B', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#2B2B2B', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="cravings" fill="#F58634" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={cravingTrend}>
                    <XAxis dataKey="day" tick={{ fill: '#2B2B2B', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#2B2B2B', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="cravings" stroke="#F58634" strokeWidth={2} dot={{ fill: '#F58634' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </GlassCard>
        </motion.div>

        {/* Trigger Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Trigger Breakdown
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : triggerBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-text-primary/50">
                <p>No trigger data available</p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={triggerBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {triggerBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-text-primary mb-4">Achievements</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : formattedAchievements.length === 0 ? (
            <div className="text-center py-8 text-text-primary/50 mb-6">
              <p>No achievements available</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide mb-6">
              {formattedAchievements.map((achievement) => {
                const getTierColor = (tier: string) => {
                  switch (tier) {
                    case 'bronze':
                      return 'text-orange-600'
                    case 'silver':
                      return 'text-gray-400'
                    case 'gold':
                      return 'text-yellow-500'
                    case 'platinum':
                      return 'text-purple-500'
                    default:
                      return 'text-brand-primary'
                  }
                }
                return (
                  <GlassCard
                    key={achievement.id}
                    className={`p-4 min-w-[120px] text-center ${
                      !achievement.unlocked ? 'opacity-50' : ''
                    }`}
                  >
                    <Trophy className={`w-10 h-10 ${getTierColor(achievement.tier || 'bronze')} mx-auto mb-2`} />
                    <div className="text-sm font-medium text-text-primary">
                      {achievement.title}
                    </div>
                    {achievement.unlocked ? (
                      <div className="text-xs text-success mt-1">✓ Unlocked</div>
                    ) : (
                      <div className="text-xs text-text-primary/50 mt-1">
                        {achievement.requirement_type === 'days_streak' && `${achievement.requirement_value} days`}
                        {achievement.requirement_type === 'cravings_resisted' && `${achievement.requirement_value} cravings`}
                        {achievement.requirement_type === 'sessions_completed' && `${achievement.requirement_value} sessions`}
                      </div>
                    )}
                  </GlassCard>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Health Improvements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Health Improvements
            </h3>
            <div className="space-y-3">
              {healthMilestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 glass-subtle p-3 rounded-xl"
                >
                  {milestone.completed ? (
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-success text-lg">✓</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-text-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-text-primary/30 text-lg">○</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">{milestone.title}</div>
                    <div className="text-xs text-text-primary/70">{milestone.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <BottomNavigation />
    </div>
  )
}

