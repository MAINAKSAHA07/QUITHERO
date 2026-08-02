import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import {
  countActiveUsersWithinHours,
  indexDailyActivity,
  listUsersActiveWithinDays,
  listUsersActiveWithinHours,
} from '../../lib/userActivity'
import { cohortRetentionPct, distinctUsers, localDayKey } from '../../lib/analyticsHelpers'
import { fetchActivityByUser, fetchActivityRecords } from '../../lib/fetchActivityByUser'
import { Users, TrendingUp, Calendar, X } from 'lucide-react'
import { D3MultiLineChart, D3HorizontalBars } from '../../components/charts/D3EngageCharts'
import { formatDistanceToNow } from 'date-fns'

type AppUser = {
  id: string
  email?: string
  name?: string
  created?: string
  lastActive?: string
}

type Drilldown = {
  title: string
  subtitle: string
  users: AppUser[]
} | null

export const UserAnalytics = () => {
  const [dateRange, setDateRange] = useState<'1' | '2' | '7' | '30' | '90' | '180' | '365'>('30')
  const [drilldown, setDrilldown] = useState<Drilldown>(null)

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
    queryFn: () =>
      adminCollectionHelpers.getFullList('session_progress', {
        expand: 'program_day',
      }),
  })

  const { data: profilesData } = useQuery({
    queryKey: ['user_profiles', 'all'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('user_profiles', {
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

  const users = (usersData?.data || []) as AppUser[]
  const sessions = sessionsData?.data || []
  const sessionProgress = sessionProgressData?.data || []
  const profiles = profilesData?.data || []
  const dailyActivity = indexDailyActivity(activityRecords)
  const usersById = useMemo(() => {
    const map = new Map<string, AppUser>()
    for (const u of users) map.set(u.id, u)
    return map
  }, [users])

  const usersFromIds = (ids: Iterable<string>) =>
    [...ids]
      .map((id) => usersById.get(id))
      .filter(Boolean) as AppUser[]

  const active24h = listUsersActiveWithinHours(users, activityByUser, 24)
  const active48h = listUsersActiveWithinHours(users, activityByUser, 48)
  const active7d = listUsersActiveWithinHours(users, activityByUser, 24 * 7)
  const dauUsers = listUsersActiveWithinDays(users, activityByUser, 1)
  const wauUsers = listUsersActiveWithinDays(users, activityByUser, 7)
  const mauUsers = listUsersActiveWithinDays(users, activityByUser, 30)

  const dau = dauUsers.length
  const wau = wauUsers.length
  const mau = mauUsers.length
  const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0

  const openActive = (title: string, subtitle: string, list: AppUser[]) => {
    setDrilldown({
      title,
      subtitle,
      users: [...list].sort((a, b) => {
        const am = activityByUser.get(a.id) || 0
        const bm = activityByUser.get(b.id) || 0
        return bm - am
      }),
    })
  }

  const generateGrowthData = () => {
    const days = Number(dateRange)
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = localDayKey(date)

      const newUsers = users.filter((u) => {
        if (!u.created) return false
        return localDayKey(u.created) === dateStr
      }).length

      const activeUsers = dailyActivity.get(dateStr)?.size ?? 0

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers,
        activeUsers,
        total: users.filter((u) => {
          if (!u.created) return false
          return new Date(u.created) <= date
        }).length,
      })
    }
    return data
  }

  const growthData = generateGrowthData()

  const generateCohortData = () => {
    const cohorts: any[] = []
    const now = new Date()

    for (let i = 3; i >= 0; i--) {
      const month = new Date(now)
      month.setMonth(month.getMonth() - i)
      const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const cohortUsers = users.filter((u) => {
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

  const kycIds = distinctUsers(profiles.filter((p: any) => p.onboarding_completed_at))
  const startedIds = distinctUsers(
    sessions.filter((s: any) => s.started_at || (s.status && s.status !== 'not_started'))
  )
  const day1Ids = distinctUsers(
    sessionProgress.filter(
      (sp: any) => sp.status === 'completed' && sp.expand?.program_day?.day_number === 1
    )
  )
  const completedIds = distinctUsers(sessions.filter((s: any) => s.status === 'completed'))
  const totalUsers = users.length || 1

  const funnelData = [
    {
      stage: 'Registered',
      value: users.length,
      percentage: 100,
      users,
    },
    {
      stage: 'Completed KYC',
      value: kycIds.size,
      percentage: Math.round((kycIds.size / totalUsers) * 100),
      users: usersFromIds(kycIds),
    },
    {
      stage: 'Started Program',
      value: startedIds.size,
      percentage: Math.round((startedIds.size / totalUsers) * 100),
      users: usersFromIds(startedIds),
    },
    {
      stage: 'Completed Day 1',
      value: day1Ids.size,
      percentage: Math.round((day1Ids.size / totalUsers) * 100),
      users: usersFromIds(day1Ids),
    },
    {
      stage: 'Completed Program',
      value: completedIds.size,
      percentage: Math.round((completedIds.size / totalUsers) * 100),
      users: usersFromIds(completedIds),
    },
  ]

  const metricCards = [
    {
      key: 'h24',
      label: 'Last 24 hours',
      value: countActiveUsersWithinHours(users, activityByUser, 24),
      hint: 'Rolling activity window',
      icon: Users,
      color: 'text-primary',
      users: active24h,
    },
    {
      key: 'h48',
      label: 'Last 48 hours',
      value: countActiveUsersWithinHours(users, activityByUser, 48),
      hint: 'Rolling activity window',
      icon: Users,
      color: 'text-secondary',
      users: active48h,
    },
    {
      key: 'd7',
      label: 'Last 7 days',
      value: countActiveUsersWithinHours(users, activityByUser, 24 * 7),
      hint: 'Rolling activity window',
      icon: Calendar,
      color: 'text-success',
      users: active7d,
    },
    {
      key: 'dau',
      label: 'DAU',
      value: dau,
      hint: 'Active today (calendar)',
      icon: Users,
      color: 'text-primary',
      users: dauUsers,
    },
    {
      key: 'wau',
      label: 'WAU',
      value: wau,
      hint: 'Active this week (calendar)',
      icon: TrendingUp,
      color: 'text-secondary',
      users: wauUsers,
    },
    {
      key: 'mau',
      label: 'MAU',
      value: mau,
      hint: 'Active this month (calendar)',
      icon: Calendar,
      color: 'text-success',
      users: mauUsers,
    },
    {
      key: 'stickiness',
      label: 'Stickiness',
      value: `${stickiness}%`,
      hint: 'DAU / MAU',
      icon: TrendingUp,
      color: 'text-warning',
      users: null as AppUser[] | null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-neutral-dark">User Analytics</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
          className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="1">Last 24 hours</option>
          <option value="2">Last 48 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 180 days</option>
          <option value="365">Last 365 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          const clickable = Array.isArray(card.users)
          return (
            <button
              key={card.key}
              type="button"
              disabled={!clickable}
              onClick={() => {
                if (!clickable || !card.users) return
                openActive(card.label, card.hint, card.users)
              }}
              className={`bg-white rounded-lg shadow-card p-5 text-left transition ${
                clickable
                  ? 'hover:ring-2 hover:ring-primary/30 cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-500">{card.label}</span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-neutral-dark">{card.value}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {card.hint}
                {clickable ? ' · click for users' : ''}
              </p>
            </button>
          )
        })}
      </div>

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

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-white/60 p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[#0E2538]">
          User Segmentation Funnel
        </h2>
        <D3HorizontalBars
          data={funnelData.map((s) => ({ label: s.stage, value: s.value }))}
          height={300}
          color="#3F8DD2"
        />
        <div className="mt-4 space-y-2">
          {funnelData.map((stage) => (
            <button
              key={stage.stage}
              type="button"
              onClick={() =>
                openActive(stage.stage, `${stage.value} users (${stage.percentage}%)`, stage.users)
              }
              className="w-full flex items-center justify-between text-sm rounded-lg px-3 py-2 hover:bg-neutral-50 text-left"
            >
              <span className="text-[#4A6574]">{stage.stage}</span>
              <div className="flex items-center gap-4">
                <span className="font-medium text-[#0E2538]">{stage.value} users</span>
                <span className="text-[#4A6574]">({stage.percentage}%)</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">User Retention Cohort</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                  Cohort
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">
                  Week 1
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">
                  Week 2
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">
                  Week 3
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase">
                  Week 4
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {cohortData.map((cohort, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-medium">{cohort.cohort}</td>
                  {(['week1', 'week2', 'week3', 'week4'] as const).map((key) => (
                    <td key={key} className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          cohort[key] >= 70
                            ? 'bg-success/10 text-success'
                            : cohort[key] >= 50
                              ? 'bg-warning/10 text-warning'
                              : key === 'week1' || key === 'week2'
                                ? 'bg-danger/10 text-danger'
                                : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {cohort[key]}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            role="dialog"
            aria-label={drilldown.title}
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-semibold text-neutral-dark">{drilldown.title}</h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {drilldown.subtitle} · {drilldown.users.length} users
                </p>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500"
                aria-label="Close"
                onClick={() => setDrilldown(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-2 py-2">
              {drilldown.users.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-neutral-500">No users in this set.</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {drilldown.users.map((u) => {
                    const lastMs = activityByUser.get(u.id)
                    return (
                      <li key={u.id}>
                        <Link
                          to={`/users/${u.id}`}
                          className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-neutral-50 rounded-lg"
                          onClick={() => setDrilldown(null)}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-dark truncate">
                              {u.name || u.email || u.id}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">{u.email || u.id}</p>
                          </div>
                          <span className="text-xs text-neutral-400 whitespace-nowrap">
                            {lastMs
                              ? formatDistanceToNow(new Date(lastMs), { addSuffix: true })
                              : u.created
                                ? `joined ${formatDistanceToNow(new Date(u.created), { addSuffix: true })}`
                                : '—'}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}