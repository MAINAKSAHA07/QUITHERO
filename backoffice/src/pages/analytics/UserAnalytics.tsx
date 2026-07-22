import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import {
  countActiveUsers,
  indexDailyActivity,
} from '../../lib/userActivity'
import { cohortRetentionPct, distinctUsers, localDayKey } from '../../lib/analyticsHelpers'
import { fetchActivityByUser, fetchActivityRecords } from '../../lib/fetchActivityByUser'
import { Users, TrendingUp, Calendar } from 'lucide-react'
import { D3MultiLineChart, D3HorizontalBars } from '../../components/charts/D3EngageCharts'

export const UserAnalytics = () => {
  const [dateRange, setDateRange] = useState<'30' | '90' | '180' | '365'>('30')

  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('users'),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
  })

  const { data: sessionProgressData } = useQuery({
    queryKey: ['session_progress', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('session_progress', {
      expand: 'program_day',
    }),
  })

  const { data: profilesData } = useQuery({
    queryKey: ['user_profiles', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_profiles', {
      fields: 'id,user,onboarding_completed_at',
    }),
  })

  const { data: activityByUser = new Map<string, number>() } = useQuery({
    queryKey: ['activity-by-user'],
    queryFn: fetchActivityByUser,
    staleTime: 60_000,
  })

  const { data: activityRecords = [] } = useQuery({
    queryKey: ['activity-records'],
    queryFn: fetchActivityRecords,
    staleTime: 60_000,
  })

  const users = usersData?.data || []
  const sessions = sessionsData?.data || []
  const sessionProgress = sessionProgressData?.data || []
  const profiles = profilesData?.data || []
  const dailyActivity = indexDailyActivity(activityRecords)

  // Calculate metrics
  const dau = countActiveUsers(users, activityByUser, 1)
  const wau = countActiveUsers(users, activityByUser, 7)
  const mau = countActiveUsers(users, activityByUser, 30)

  const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0

  // User growth data
  const generateGrowthData = () => {
    const days = dateRange === '30' ? 30 : dateRange === '90' ? 90 : dateRange === '180' ? 180 : 365
    const data = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = localDayKey(date)
      
      const newUsers = users.filter((u: any) => {
        if (!u.created) return false
        return localDayKey(u.created) === dateStr
      }).length

      const activeUsers = dailyActivity.get(dateStr)?.size ?? 0

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers,
        activeUsers,
        total: users.filter((u: any) => {
          if (!u.created) return false
          return new Date(u.created) <= date
        }).length,
      })
    }
    return data
  }

  const growthData = generateGrowthData()

  // Retention cohort (simplified)
  const generateCohortData = () => {
    const cohorts: any[] = []
    const now = new Date()
    
    for (let i = 3; i >= 0; i--) {
      const month = new Date(now)
      month.setMonth(month.getMonth() - i)
      const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      const cohortUsers = users.filter((u: any) => {
        if (!u.created) return false
        const created = new Date(u.created)
        return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear()
      })

      cohorts.push({
        cohort: monthStr,
        week1: cohortRetentionPct(cohortUsers, activityByUser, 7),
        week2: cohortRetentionPct(cohortUsers, activityByUser, 14),
        week3: cohortRetentionPct(cohortUsers, activityByUser, 21),
        week4: cohortRetentionPct(cohortUsers, activityByUser, 28),
      })
    }
    return cohorts
  }

  const cohortData = generateCohortData()

  const kycCompleted = distinctUsers(
    profiles.filter((p: any) => p.onboarding_completed_at)
  ).size
  const startedProgram = distinctUsers(
    sessions.filter(
      (s: any) => s.started_at || (s.status && s.status !== 'not_started')
    )
  ).size
  const completedDay1 = distinctUsers(
    sessionProgress.filter(
      (sp: any) =>
        sp.status === 'completed' && sp.expand?.program_day?.day_number === 1
    )
  ).size
  const completedProgram = distinctUsers(
    sessions.filter((s: any) => s.status === 'completed')
  ).size
  const totalUsers = users.length || 1

  // User funnel (distinct users per stage)
  const funnelData = [
    { stage: 'Registered', value: users.length, percentage: 100 },
    {
      stage: 'Completed KYC',
      value: kycCompleted,
      percentage: Math.round((kycCompleted / totalUsers) * 100),
    },
    {
      stage: 'Started Program',
      value: startedProgram,
      percentage: Math.round((startedProgram / totalUsers) * 100),
    },
    {
      stage: 'Completed Day 1',
      value: completedDay1,
      percentage: Math.round((completedDay1 / totalUsers) * 100),
    },
    {
      stage: 'Completed Program',
      value: completedProgram,
      percentage: Math.round((completedProgram / totalUsers) * 100),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-neutral-dark">User Analytics</h1>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
            <option value="365">Last 365 days</option>
          </select>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">DAU</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{dau}</p>
          <p className="text-xs text-neutral-500 mt-1">Daily Active Users</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">WAU</span>
            <TrendingUp className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{wau}</p>
          <p className="text-xs text-neutral-500 mt-1">Weekly Active Users</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">MAU</span>
            <Calendar className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{mau}</p>
          <p className="text-xs text-neutral-500 mt-1">Monthly Active Users</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Stickiness</span>
            <TrendingUp className="w-5 h-5 text-warning" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{stickiness}%</p>
          <p className="text-xs text-neutral-500 mt-1">DAU/MAU Ratio</p>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-white/60 p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[#0E2538]">User Growth</h2>
        <D3MultiLineChart
          data={growthData}
          xKey="date"
          height={300}
          series={[
            { key: 'total', label: 'Total Users', color: '#F6B884' },
            { key: 'activeUsers', label: 'Active Users', color: '#3F8DD2' },
            { key: 'newUsers', label: 'New Registrations', color: '#6EA48F' },
          ]}
        />
      </div>

      {/* User Segmentation Funnel */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-white/60 p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[#0E2538]">User Segmentation Funnel</h2>
        <D3HorizontalBars
          data={funnelData.map((s) => ({ label: s.stage, value: s.value }))}
          height={300}
          color="#3F8DD2"
        />
        <div className="mt-4 space-y-2">
          {funnelData.map((stage, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-[#4A6574]">{stage.stage}</span>
              <div className="flex items-center gap-4">
                <span className="font-medium text-[#0E2538]">{stage.value} users</span>
                <span className="text-[#4A6574]">({stage.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Cohort Table */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">User Retention Cohort</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Cohort</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Week 1</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Week 2</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Week 3</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">Week 4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {cohortData.map((cohort, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-medium">{cohort.cohort}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      cohort.week1 >= 70 ? 'bg-success/10 text-success' :
                      cohort.week1 >= 50 ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {cohort.week1}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      cohort.week2 >= 70 ? 'bg-success/10 text-success' :
                      cohort.week2 >= 50 ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {cohort.week2}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-500">
                      {cohort.week3}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-500">
                      {cohort.week4}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
