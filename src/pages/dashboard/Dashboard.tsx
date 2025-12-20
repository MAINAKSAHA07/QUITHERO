import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Users, Activity, Trophy, MessageSquare, UserPlus } from 'lucide-react'
import { MetricCard } from '../../components/common/MetricCard'
import { UserGrowthChart } from '../../components/charts/UserGrowthChart'
import { ProgramProgressChart } from '../../components/charts/ProgramProgressChart'
import { ActivityFeed } from '../../components/common/ActivityFeed'
import { QuickActions } from '../../components/common/QuickActions'
import { formatDistanceToNow } from 'date-fns'

export const Dashboard = () => {
  const [activities, setActivities] = useState<any[]>([])

  const { data: usersData } = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => adminCollectionHelpers.getFullList('users'),
  })

  const { data: _programsData } = useQuery({
    queryKey: ['programs'],
    queryFn: () => adminCollectionHelpers.getFullList('programs'),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'completed'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions', {
      filter: 'status = "completed"',
    }),
  })

  const { data: allSessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
  })

  const { data: supportTicketsData } = useQuery({
    queryKey: ['support_tickets', 'pending'],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('support_tickets', {
          filter: 'status = "pending" || status = "open"',
        })
      } catch (error: any) {
        // If collection doesn't exist or has errors, return empty
        if (error?.status === 404 || error?.status === 400) {
          return { success: true, data: [] }
        }
        throw error
      }
    },
    retry: false, // Don't retry if collection doesn't exist
  })

  const { data: recentUsers } = useQuery({
    queryKey: ['users', 'recent'],
    queryFn: () => adminCollectionHelpers.getList('users', 1, 10, {
      sort: '-created',
    }),
  })

  const { data: recentAchievements } = useQuery({
    queryKey: ['achievements', 'recent'],
    queryFn: () => adminCollectionHelpers.getList('user_achievements', 1, 5, {
      sort: '-unlocked_at',
      expand: 'user,achievement',
    }),
  })

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
  
  // Calculate active users (logged in last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const activeUsers = usersData?.data?.filter((u: any) => {
    if (!u.lastActive) return false
    return new Date(u.lastActive) > sevenDaysAgo
  }).length || 0

  const completedPrograms = sessionsData?.data?.length || 0
  const completionRate = totalUsers > 0 ? Math.round((completedPrograms / totalUsers) * 100) : 0
  
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
      
      // Active users in this month (users who were active at least once)
      const activeUsers = usersData?.data?.filter((u: any) => {
        if (!u.lastActive) return false
        const lastActive = new Date(u.lastActive)
        return lastActive >= month && lastActive < nextMonth
      }).length || 0
      
      // Churned users (users who were active before but not in this month)
      const churned = usersData?.data?.filter((u: any) => {
        if (!u.lastActive || !u.created) return false
        const created = new Date(u.created)
        const lastActive = new Date(u.lastActive)
        // User was created before this month but not active in this month
        return created < month && lastActive < month && lastActive >= new Date(month.getTime() - 30 * 24 * 60 * 60 * 1000)
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
    
    // Users who haven't started
    const notStarted = users.filter((u: any) => {
      return !allSessions.some((s: any) => s.user === u.id)
    }).length
    
    // Users by day progress
    const days1to3 = allSessions.filter((s: any) => {
      const day = s.current_day || 0
      return day >= 1 && day <= 3 && s.status !== 'completed'
    }).length
    
    const days4to7 = allSessions.filter((s: any) => {
      const day = s.current_day || 0
      return day >= 4 && day <= 7 && s.status !== 'completed'
    }).length
    
    const days8to10 = allSessions.filter((s: any) => {
      const day = s.current_day || 0
      return day >= 8 && day <= 10 && s.status !== 'completed'
    }).length
    
    // Completed programs
    const completed = allSessions.filter((s: any) => s.status === 'completed').length
    
    const total = notStarted + days1to3 + days4to7 + days8to10 + completed
    
    if (total === 0) {
      return [
        { name: 'Not Started', value: 0, color: '#9ca3af' },
        { name: 'Days 1-3', value: 0, color: '#FFD08A' },
        { name: 'Days 4-7', value: 0, color: '#F58634' },
        { name: 'Days 8-10', value: 0, color: '#D45A1C' },
        { name: 'Completed', value: 0, color: '#4CAF50' },
      ]
    }
    
    return [
      { name: 'Not Started', value: notStarted, color: '#9ca3af' },
      { name: 'Days 1-3', value: days1to3, color: '#FFD08A' },
      { name: 'Days 4-7', value: days4to7, color: '#F58634' },
      { name: 'Days 8-10', value: days8to10, color: '#D45A1C' },
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
          title="Completed Programs"
          value={completedPrograms}
          subtitle={`${completionRate}% completion rate`}
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
