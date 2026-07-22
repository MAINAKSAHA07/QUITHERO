import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { activitySinceDate, recordInRange } from '../../lib/analyticsHelpers'
import {
  D3Donut,
  D3ColumnChart,
  D3HorizontalBars,
  ENGAGE_COLORS,
} from '../../components/charts/D3EngageCharts'

export const EngagementMetrics = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month')

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
    queryFn: () =>
      adminCollectionHelpers.getFullList('user_achievements', {
        expand: 'achievement',
      }),
  })

  const { data: progressData } = useQuery({
    queryKey: ['session_progress', 'all', 'expand'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('session_progress', {
        expand: 'program_day',
      }),
  })

  const { data: daysData } = useQuery({
    queryKey: ['program_days', 'all'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('program_days', {
        fields: 'id,day_number',
        sort: 'day_number',
      }),
  })

  const since = activitySinceDate(dateRange)
  const inRange = (raw?: string) => recordInRange(raw, since)

  const cravings = (cravingsData?.data || []).filter((c: any) => inRange(c.created || c.updated))
  const journalEntries = (journalData?.data || []).filter((e: any) =>
    inRange(e.date || e.created)
  )
  const achievements = (achievementsData?.data || []).filter((a: any) => inRange(a.unlocked_at))
  const allProgress = progressData?.data || []
  const completedProgress = allProgress.filter(
    (p: any) => p.status === 'completed' && inRange(p.completed_at)
  )
  const progressTouches = allProgress.filter((p: any) => inRange(p.completed_at)).length

  const days = (daysData?.data || [])
    .slice()
    .sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0))

  const totalFeatureUsage =
    completedProgress.length + cravings.length + journalEntries.length + progressTouches

  const featureUsageData = [
    {
      name: 'Day Completions',
      value: completedProgress.length,
      percentage:
        totalFeatureUsage > 0
          ? Math.round((completedProgress.length / totalFeatureUsage) * 100)
          : 0,
    },
    {
      name: 'Craving Logs',
      value: cravings.length,
      percentage:
        totalFeatureUsage > 0 ? Math.round((cravings.length / totalFeatureUsage) * 100) : 0,
    },
    {
      name: 'Journal Entries',
      value: journalEntries.length,
      percentage:
        totalFeatureUsage > 0
          ? Math.round((journalEntries.length / totalFeatureUsage) * 100)
          : 0,
    },
    {
      name: 'Day Progress Rows',
      value: progressTouches,
      percentage:
        totalFeatureUsage > 0 ? Math.round((progressTouches / totalFeatureUsage) * 100) : 0,
    },
  ].filter((item) => item.value > 0)

  const sessionCompletionData = days.map((day: any) => {
    const dayNumber = day.day_number
    const dayRows = allProgress.filter(
      (p: any) =>
        p.program_day === day.id || p.expand?.program_day?.day_number === dayNumber
    )
    const completed = dayRows.filter((p: any) => {
      if (p.status !== 'completed') return false
      return inRange(p.completed_at)
    })
    const completionRate =
      dayRows.length > 0 ? Math.round((completed.length / dayRows.length) * 100) : 0
    return {
      label: `D${dayNumber}`,
      value: completionRate,
      started: dayRows.length,
      completed: completed.length,
    }
  })

  const triggerChartData = Object.entries(
    cravings.reduce((acc: Record<string, number>, craving: any) => {
      const trigger = craving.trigger || 'other'
      acc[trigger] = (acc[trigger] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  }))

  const intensityData = Array.from({ length: 5 }, (_, i) => {
    const intensity = i + 1
    return {
      label: String(intensity),
      value: cravings.filter((c: any) => c.intensity === intensity).length,
    }
  })

  const moodChartData = Object.entries(
    journalEntries.reduce((acc: Record<string, number>, entry: any) => {
      const mood = entry.mood || 'neutral'
      acc[mood] = (acc[mood] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: value as number,
  }))

  const achievementChartData = Object.entries(
    achievements.reduce((acc: Record<string, number>, ua: any) => {
      const achievement = ua.expand?.achievement
      if (!achievement) return acc
      const key = achievement.title || 'Unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  )
    .map(([label, value]) => ({ label, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  const slipRate =
    cravings.length > 0
      ? Math.round((cravings.filter((c: any) => c.type === 'slip').length / cravings.length) * 100)
      : 0

  const avgCompletion =
    sessionCompletionData.length > 0
      ? Math.round(
          sessionCompletionData.reduce((acc, d) => acc + d.value, 0) / sessionCompletionData.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Engagement Metrics</h1>
          <p className="text-sm text-neutral-500 mt-1">Interactive D3 visuals from live product data</p>
        </div>
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

      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Feature Usage</h2>
        {featureUsageData.length === 0 ? (
          <p className="text-sm text-neutral-500">No engagement events in this range.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <D3Donut data={featureUsageData} centerLabel="Events" height={300} />
            <div className="space-y-3">
              {featureUsageData.map((feature, index) => (
                <div key={feature.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ENGAGE_COLORS[index % ENGAGE_COLORS.length] }}
                    />
                    <span className="text-sm text-neutral-600">{feature.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium tabular-nums">{feature.value}</span>
                    <span className="text-sm text-neutral-500 w-10 text-right tabular-nums">
                      {feature.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-1">Day Completion Rate</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Among users with a progress row for that day, % marked completed.
        </p>
        <D3ColumnChart
          data={sessionCompletionData}
          max={100}
          valueSuffix="%"
          color="#3F8DD2"
          height={320}
        />
        <p className="mt-3 text-sm text-neutral-500">
          Average completion across days: <span className="font-medium text-neutral-700">{avgCompletion}%</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Trigger Distribution</h2>
          {triggerChartData.length === 0 ? (
            <p className="text-sm text-neutral-500 py-16 text-center">No cravings in this range.</p>
          ) : (
            <D3Donut data={triggerChartData} centerLabel="Triggers" height={260} />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Intensity Distribution</h2>
          <D3ColumnChart data={intensityData} color="#2A72B5" height={240} />
          <div className="mt-4 p-3 bg-warning/10 rounded-lg">
            <p className="text-sm font-medium text-warning">
              Slip share: {slipRate}% of craving logs are marked as slips
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Most Common Moods</h2>
          {moodChartData.length === 0 ? (
            <p className="text-sm text-neutral-500 py-16 text-center">No journal entries in this range.</p>
          ) : (
            <>
              <D3Donut data={moodChartData} centerLabel="Entries" height={260} />
              <p className="mt-3 text-sm text-neutral-500">
                Average entries per user:{' '}
                {journalEntries.length > 0
                  ? Math.round(
                      journalEntries.length /
                        (new Set(journalEntries.map((e: any) => e.user)).size || 1)
                    )
                  : 0}
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Unlocked Achievements</h2>
          {achievementChartData.length === 0 ? (
            <p className="text-sm text-neutral-500 py-16 text-center">No unlocks in this range.</p>
          ) : (
            <D3HorizontalBars data={achievementChartData} height={280} color="#3F8DD2" />
          )}
        </div>
      </div>
    </div>
  )
}
