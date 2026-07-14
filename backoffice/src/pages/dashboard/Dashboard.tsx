import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { countActiveUsers, getUserLastActive } from '../../lib/userActivity'
import { fetchActivityByUser } from '../../lib/fetchActivityByUser'
import { Users, Activity, Trophy, MessageSquare, UserPlus } from 'lucide-react'
import { MetricCard } from '../../components/common/MetricCard'
import { UserGrowthChart } from '../../components/charts/UserGrowthChart'
import { ProgramProgressChart } from '../../components/charts/ProgramProgressChart'
import { ActivityFeed } from '../../components/common/ActivityFeed'
import { QuickActions } from '../../components/common/QuickActions'
import { formatDistanceToNow } from 'date-fns'

export const Dashboard = () => {
  const [activities, setActivities] = useState<any[]>([])
  const { isAuthenticated } = useAdminAuth()
  const queryEnabled = isAuthenticated

  const { data: usersData, isError: usersError, error: usersErr } = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => adminCollectionHelpers.getFullList('users'),
    enabled: queryEnabled,
  })

  const { data: _programsData } = useQuery({
    queryKey: ['programs'],
    queryFn: () => adminCollectionHelpers.getFullList('programs'),
    enabled: queryEnabled,
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'completed'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions', {
      filter: 'status = "completed"',
    }),
    enabled: queryEnabled,
  })

  const { data: allSessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
    enabled: queryEnabled,
  })

  const { data: sessionProgressData } = useQuery({
    queryKey: ['session_progress', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('session_progress'),
    enabled: queryEnabled,
  })

  const { data: activityByUser = new Map<string, number>() } = useQuery({
    queryKey: ['activity-by-user'],
    queryFn: fetchActivityByUser,
    enabled: queryEnabled,
    staleTime: 60_000,
  })

  const { data: supportTicketsData } = useQuery({
    queryKey: ['support_tickets', 'pending'],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('support_tickets', {
          filter: 'status = "open" || status = "in_progress"',
        })
      } catch (error: any) {
        // If collection doesn't exist or has errors, return empty
        if (error?.status === 404 || error?.status === 400) {
          return { success: true, data: [] }
        }
        throw error
      }
    },
    retry: false,
    enabled: queryEnabled,
  })

  const { data: recentUsers } = useQuery({
    queryKey: ['users', 'recent'],
    queryFn: () => adminCollectionHelpers.getList('users', 1, 10, {
      sort: recentSort('users'),
    }),
    enabled: queryEnabled,
  })

  const { data: recentAchievements } = useQuery({
    queryKey: ['achievements', 'recent'],
    queryFn: () => adminCollectionHelpers.getList('user_achievements', 1, 5, {
      sort: '-unlocked_at',
      expand: 'user,achievement',
    }),
    enabled: queryEnabled,
  })

  const { data: programDaysMeta } = useQuery({
    queryKey: ['program_days', 'meta'],
    queryFn: () => adminCollectionHelpers.getFullList('program_days', {
      fields: 'day_number',
      sort: 'day_number',
    }),
    enabled: queryEnabled,
  })

  const maxProgramDay = Math.max(
    1,
    ...(programDaysMeta?.data || []).map((d: any) => d.day_number || 0)
  )

  const fetchFailed = usersData?.success === false

  useEffect(() => {
    const loadActivities = async () => {
      const newActivities: any[] = []

      // Recent user registrations
      if (recentUsers?.data && 'items' in recentUsers.data) {
        (recentUsers.data as any).items.slice(0, 3).forEach((user: any) => {
          newActivities.push({
            type: 'user_registered',
            message: `${user.name || user.email} just registered`,
            time: formatDistanceToNow(new Date(user.created), { addSuffix: true }),
            icon: UserPlus,
            color: 'text-primary',
            timestamp: new Date(user.created).getTime(),
          })
        })
      }

      // Program completions
      if (sessionsData?.data) {
        sessionsData.data.slice(0, 2).forEach((session: any) => {
          newActivities.push({
            type: 'program_completed',
            message: `User completed the program`,
            time: formatDistanceToNow(new Date(session.completed_at || session.updated), { addSuffix: true }),
            icon: Trophy,
            color: 'text-success',
            timestamp: new Date(session.completed_at || session.updated).getTime(),
          })
        })
      }

      // Achievement unlocks
      if (recentAchievements?.data && 'items' in recentAchievements.data) {
        (recentAchievements.data as any).items.forEach((ua: any) => {
          newActivities.push({
            type: 'achievement_unlocked',
            message: `${ua.expand?.user?.name || 'User'} unlocked "${ua.expand?.achievement?.title || 'Achievement'}"`,
            time: formatDistanceToNow(new Date(ua.unlocked_at), { addSuffix: true }),
            icon: Trophy,
            color: 'text-warning',
            timestamp: new Date(ua.unlocked_at).getTime(),
          })
        })
      }

      // Sort by timestamp and take latest 10
      newActivities.sort((a, b) => b.timestamp - a.timestamp)
      setActivities(newActivities.slice(0, 10))
    }

    loadActivities()
  }, [recentUsers, sessionsData, recentAchievements])

  const totalUsers = usersData?.data?.length || 0

  // Active = real app usage in last 7 calendar days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const activeUsers = countActiveUsers(usersData?.data || [], activityByUser, 7)

  const completedDailySessions = (sessionProgressData?.data || []).filter(
    (s: any) => s.status === 'completed'
  ).length
  const programGraduates = (allSessionsData?.data || []).filter(
    (s: any) => s.status === 'completed'
  ).length
  
  // Calculate pending tickets
  const pendingTickets = supportTicketsData?.data?.length || 0

  // Calculate month-over-month growth
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const lastMonth = new Date(thisMonth)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const thisMonthUsers = usersData?.data?.filter((u: any) => 
    new Date(u.created) >= thisMonth
  ).length || 0
  
  const lastMonthUsers = usersData?.data?.filter((u: any) => {
    const created = new Date(u.created)
    return created >= lastMonth && created < thisMonth
  }).length || 0

  const growthPercent = lastMonthUsers > 0 
    ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
    : thisMonthUsers > 0 ? 100 : 0

  // Calculate user growth data for the last 6 months
  const calculateUserGrowthData = () => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthName = month.toLocaleDateString('en-US', { month: 'short' })
      
      // New users registered this month
      const newUsers = usersData?.data?.filter((u: any) => {
        if (!u.created) return false
        const created = new Date(u.created)
        return created >= month && created < nextMonth
      }).length || 0
      
      // Active users in this month (from session activity + lastActive)
      const activeUsers = usersData?.data?.filter((u: any) => {
        const last = getUserLastActive(u, activityByUser.get(u.id))
        if (!last) return false
        return last >= month && last < nextMonth
      }).length || 0
      
      // Churned users (users who were active before but not in this month)
      const churned = usersData?.data?.filter((u: any) => {
        if (!u.created) return false
        const created = new Date(u.created)
        const last = getUserLastActive(u, activityByUser.get(u.id))
        if (!last) return created < month
        return created < month && last < month && last >= new Date(month.getTime() - 30 * 24 * 60 * 60 * 1000)
      }).length || 0
      
      months.push({
        date: monthName,
        newUsers,
        activeUsers,
        churned,
      })
    }
    
    return months
  }

  // Calculate program progress distribution
  const calculateProgramProgressData = () => {
    const allSessions = allSessionsData?.data || []
    const users = usersData?.data || []
    const third = Math.max(1, Math.floor(maxProgramDay / 3))
    const twoThird = Math.max(2, Math.floor((maxProgramDay * 2) / 3))

    const notStarted = users.filter((u: any) => {
      return !allSessions.some((s: any) => s.user === u.id)
    }).length

    const early = allSessions.filter((s: any) => {
      const day = s.current_day || 0
      return day >= 1 && day <= third && s.status !== 'completed'
    }).length

    const mid = allSessions.filter((s: any) => {
      const day = s.current_day || 0
      return day > third && day <= twoThird && s.status !== 'completed'
    }).length

    const late = allSessions.filter((s: any) => {
      const day = s.current_day || 0
      return day > twoThird && day <= maxProgramDay && s.status !== 'completed'
    }).length

    const completed = allSessions.filter((s: any) => s.status === 'completed').length

    const total = notStarted + early + mid + late + completed

    if (total === 0) {
      return [
        { name: 'Not Started', value: 0, color: '#9ca3af' },
        { name: `Days 1-${third}`, value: 0, color: '#FFD08A' },
        { name: `Days ${third + 1}-${twoThird}`, value: 0, color: '#F58634' },
        { name: `Days ${twoThird + 1}-${maxProgramDay}`, value: 0, color: '#D45A1C' },
        { name: 'Completed', value: 0, color: '#4CAF50' },
      ]
    }

    return [
      { name: 'Not Started', value: notStarted, color: '#9ca3af' },
      { name: `Days 1-${third}`, value: early, color: '#FFD08A' },
      { name: `Days ${third + 1}-${twoThird}`, value: mid, color: '#F58634' },
      { name: `Days ${twoThird + 1}-${maxProgramDay}`, value: late, color: '#D45A1C' },
      { name: 'Completed', value: completed, color: '#4CAF50' },
    ]
  }

  const userGrowthData = calculateUserGrowthData()
  const programProgressData = calculateProgramProgressData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-dark">Dashboard</h1>
      </div>

      {(fetchFailed || usersError) && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Could not load dashboard data — your session may have expired.{' '}
          {(usersData as { error?: string })?.error || (usersErr as Error)?.message || 'Sign out and sign in again.'}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          subtitle="Total Users"
          trend={growthPercent > 0 ? `+${growthPercent}% this month` : `${growthPercent}% this month`}
          trendUp={growthPercent > 0}
          icon={Users}
          gradient="from-white to-primary/20"
        />
        <MetricCard
          title="Active Users (7d)"
          value={activeUsers}
          subtitle={`${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% of total`}
          icon={Activity}
          gradient="from-white to-secondary/20"
        />
        <MetricCard
          title="Sessions Completed"
          value={completedDailySessions}
          subtitle={`${programGraduates} completed full program`}
          icon={Trophy}
          gradient="from-white to-success/20"
        />
        <MetricCard
          title="Pending Tickets"
          value={pendingTickets}
          subtitle="Pending Tickets"
          icon={MessageSquare}
          gradient="from-white to-warning/20"
          alert={pendingTickets > 10 ? 'danger' : pendingTickets > 5 ? 'warning' : undefined}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">User Growth</h2>
            <UserGrowthChart data={userGrowthData} />
          </div>
        </div>
        <div>
          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Program Progress</h2>
            <ProgramProgressChart data={programProgressData} />
          </div>
        </div>
      </div>

      {/* Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities} />
        <QuickActions />
      </div>
    </div>
  )
}
