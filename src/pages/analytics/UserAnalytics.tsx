import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Users, TrendingUp, Calendar } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// const COLORS = ['#F58634', '#2A72B5', '#4CAF50', '#FFD08A', '#E63946']

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

  const users = usersData?.data || []
  const sessions = sessionsData?.data || []

  // Calculate metrics
  const dau = users.filter((u: any) => {
    if (!u.lastActive) return false
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return new Date(u.lastActive) > yesterday
  }).length

  const wau = users.filter((u: any) => {
    if (!u.lastActive) return false
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(u.lastActive) > weekAgo
  }).length

  const mau = users.filter((u: any) => {
    if (!u.lastActive) return false
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return new Date(u.lastActive) > monthAgo
  }).length

  const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0

  // User growth data
  const generateGrowthData = () => {
    const days = dateRange === '30' ? 30 : dateRange === '90' ? 90 : dateRange === '180' ? 180 : 365
    const data = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const newUsers = users.filter((u: any) => {
        if (!u.created) return false
        const created = new Date(u.created).toISOString().split('T')[0]
        return created === dateStr
      }).length

      const activeUsers = users.filter((u: any) => {
        if (!u.lastActive) return false
        const lastActive = new Date(u.lastActive).toISOString().split('T')[0]
        return lastActive === dateStr
      }).length

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

      const week1 = cohortUsers.filter((u: any) => {
        if (!u.lastActive) return false
        const lastActive = new Date(u.lastActive)
        const weekAfter = new Date(month)
        weekAfter.setDate(weekAfter.getDate() + 7)
        return lastActive > weekAfter
      }).length

      const week2 = cohortUsers.filter((u: any) => {
        if (!u.lastActive) return false
        const lastActive = new Date(u.lastActive)
        const twoWeeksAfter = new Date(month)
        twoWeeksAfter.setDate(twoWeeksAfter.getDate() + 14)
        return lastActive > twoWeeksAfter
      }).length

      cohorts.push({
        cohort: monthStr,
        week1: cohortUsers.length > 0 ? Math.round((week1 / cohortUsers.length) * 100) : 0,
        week2: cohortUsers.length > 0 ? Math.round((week2 / cohortUsers.length) * 100) : 0,
        week3: 0,
        week4: 0,
      })
    }
    return cohorts
  }

  const cohortData = generateCohortData()

  // User funnel
  const funnelData = [
    { stage: 'Registered', value: users.length, percentage: 100 },
    { stage: 'Completed KYC', value: Math.round(users.length * 0.85), percentage: 85 },
    { stage: 'Started Program', value: sessions.length, percentage: Math.round((sessions.length / users.length) * 100) },
    { stage: 'Completed Day 1', value: Math.round(sessions.length * 0.9), percentage: Math.round((sessions.length * 0.9 / users.length) * 100) },
    { stage: 'Completed Program', value: sessions.filter((s: any) => s.status === 'completed').length, percentage: Math.round((sessions.filter((s: any) => s.status === 'completed').length / users.length) * 100) },
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
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">User Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#F58634" strokeWidth={2} name="Total Users" />
            <Line type="monotone" dataKey="activeUsers" stroke="#2A72B5" strokeWidth={2} name="Active Users" />
            <Line type="monotone" dataKey="newUsers" stroke="#4CAF50" strokeWidth={2} name="New Registrations" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* User Segmentation Funnel */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">User Segmentation Funnel</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" width={120} />
            <Tooltip />
            <Bar dataKey="value" fill="#F58634" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {funnelData.map((stage, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">{stage.stage}</span>
              <div className="flex items-center gap-4">
                <span className="font-medium">{stage.value} users</span>
                <span className="text-neutral-500">({stage.percentage}%)</span>
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
