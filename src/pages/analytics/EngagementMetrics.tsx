import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#F58634', '#2A72B5', '#4CAF50', '#FFD08A', '#E63946']

export const EngagementMetrics = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month')

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
  })

  const { data: cravingsData } = useQuery({
    queryKey: ['cravings', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('cravings'),
  })

  const { data: journalData } = useQuery({
    queryKey: ['journal_entries', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('journal_entries'),
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['user_achievements', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_achievements', {
      expand: 'achievement',
    }),
  })

  const sessions = sessionsData?.data || []
  const cravings = cravingsData?.data || []
  const journalEntries = journalData?.data || []
  const achievements = achievementsData?.data || []

  // Feature Usage Data - calculate real percentages
  const { data: progressData } = useQuery({
    queryKey: ['session_progress', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('session_progress'),
  })

  const progressViews = progressData?.data?.length || 0
  const totalFeatureUsage = sessions.length + cravings.length + journalEntries.length + progressViews
  
  const featureUsageData = [
    { name: 'Sessions/Program', value: sessions.length, percentage: totalFeatureUsage > 0 ? Math.round((sessions.length / totalFeatureUsage) * 100) : 0 },
    { name: 'Craving Logs', value: cravings.length, percentage: totalFeatureUsage > 0 ? Math.round((cravings.length / totalFeatureUsage) * 100) : 0 },
    { name: 'Journal Entries', value: journalEntries.length, percentage: totalFeatureUsage > 0 ? Math.round((journalEntries.length / totalFeatureUsage) * 100) : 0 },
    { name: 'Progress View', value: progressViews, percentage: totalFeatureUsage > 0 ? Math.round((progressViews / totalFeatureUsage) * 100) : 0 },
  ].filter(item => item.value > 0) // Only show features with actual usage

  // Session Completion by Day - calculate real completion rates
  const sessionCompletionData = Array.from({ length: 10 }, (_, i) => {
    const dayNumber = i + 1
    const daySessions = sessions.filter((s: any) => {
      const currentDay = s.current_day || 0
      return currentDay >= dayNumber
    })
    const completed = daySessions.filter((s: any) => {
      const currentDay = s.current_day || 0
      return currentDay > dayNumber || s.status === 'completed'
    })
    const completionRate = daySessions.length > 0 ? Math.round((completed.length / daySessions.length) * 100) : 0
    return {
      day: `Day ${dayNumber}`,
      completionRate,
    }
  })

  // Craving Patterns - Trigger Distribution
  const triggerData = cravings.reduce((acc: any, craving: any) => {
    const trigger = craving.trigger || 'other'
    acc[trigger] = (acc[trigger] || 0) + 1
    return acc
  }, {})

  const triggerChartData = Object.entries(triggerData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Intensity Distribution
  const intensityData = Array.from({ length: 5 }, (_, i) => {
    const intensity = i + 1
    const count = cravings.filter((c: any) => c.intensity === intensity).length
    return {
      intensity: `${intensity}`,
      count,
    }
  })

  // Journal Engagement
  const moodData = journalEntries.reduce((acc: any, entry: any) => {
    const mood = entry.mood || 'neutral'
    acc[mood] = (acc[mood] || 0) + 1
    return acc
  }, {})

  const moodChartData = Object.entries(moodData).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }))

  // Achievement Unlocking
  const achievementData = achievements.reduce((acc: any, ua: any) => {
    const achievement = ua.expand?.achievement
    if (!achievement) return acc
    const key = achievement.title || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const achievementChartData = Object.entries(achievementData)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 10)

  const slipRate = cravings.length > 0
    ? Math.round((cravings.filter((c: any) => c.type === 'slip').length / cravings.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-neutral-dark">Engagement Metrics</h1>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Feature Usage */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Feature Usage</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={featureUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {featureUsageData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {featureUsageData.map((feature, index) => (
              <div key={feature.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-neutral-600">{feature.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{feature.value}</span>
                  <span className="text-sm text-neutral-500">{feature.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Completion Metrics */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Session Completion Rate by Day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sessionCompletionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="completionRate" fill="#F58634" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-neutral-500">
          <p>Average completion rate: {Math.round(sessionCompletionData.reduce((acc: number, d: any) => acc + d.completionRate, 0) / sessionCompletionData.length)}%</p>
        </div>
      </div>

      {/* Craving Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Trigger Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={triggerChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {triggerChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Intensity Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={intensityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="intensity" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2A72B5" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-warning/10 rounded-lg">
            <p className="text-sm font-medium text-warning">
              Slip Rate: {slipRate}% of cravings result in slips
            </p>
          </div>
        </div>
      </div>

      {/* Journal Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Most Common Moods</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={moodChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {moodChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-neutral-500">
            <p>Average entries per user: {journalEntries.length > 0 ? Math.round(journalEntries.length / (new Set(journalEntries.map((e: any) => e.user)).size || 1)) : 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Unlocked Achievements</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={achievementChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#F58634" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
