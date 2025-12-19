import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { TrendingDown, Users, Calendar, Download, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#F58634', '#2A72B5', '#4CAF50', '#FFD08A', '#E63946']

export const RetentionReports = () => {
  const [dateRange, setDateRange] = useState<'30' | '90' | '180' | '365'>('90')

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

  // Retention Curve Data
  const generateRetentionData = () => {
    const days = dateRange === '30' ? 30 : dateRange === '90' ? 90 : dateRange === '180' ? 180 : 365
    const retentionData = []
    
    for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 20))) {
      const activeUsers = users.filter((u: any) => {
        if (!u.lastActive) return false
        const lastActive = new Date(u.lastActive)
        const daysSinceActive = Math.floor((new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceActive <= i
      }).length
      
      const retentionRate = users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0
      retentionData.push({
        days: i,
        retention: retentionRate,
      })
    }
    return retentionData
  }

  const retentionData = generateRetentionData()

  // Churn Analysis
  const churnedUsers = users.filter((u: any) => {
    if (!u.lastActive) return true
    const lastActive = new Date(u.lastActive)
    const daysSinceActive = Math.floor((new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceActive > 30
  })

  const churnRate = users.length > 0 ? Math.round((churnedUsers.length / users.length) * 100) : 0

  // Churn Reasons (mock data - would come from exit surveys)
  const churnReasonsData = [
    { name: 'Program too difficult', value: 35 },
    { name: 'Lack of time', value: 25 },
    { name: 'Not seeing results', value: 20 },
    { name: 'Technical issues', value: 10 },
    { name: 'Other', value: 10 },
  ]

  // Win-back Campaign List
  const winBackUsers = churnedUsers.map((user: any) => {
    const userSessions = sessions.filter((s: any) => s.user === user.id)
    const lastSession = userSessions.sort((a: any, b: any) => 
      new Date(b.updated || b.created).getTime() - new Date(a.updated || a.created).getTime()
    )[0]
    
    return {
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      lastActive: user.lastActive ? new Date(user.lastActive) : null,
      daysSinceActive: user.lastActive 
        ? Math.floor((new Date().getTime() - new Date(user.lastActive).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      programProgress: lastSession?.current_day || 0,
      suggestedAction: lastSession?.current_day < 3 ? 'Send personalized email' : 'Offer incentive',
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-neutral-dark">Retention Reports</h1>
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
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Retention Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Churn Rate</span>
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{churnRate}%</p>
          <p className="text-xs text-neutral-500 mt-1">{churnedUsers.length} churned users</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Active Users</span>
            <Users className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{users.length - churnedUsers.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Currently active</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Win-Back Candidates</span>
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{winBackUsers.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Users to re-engage</p>
        </div>
      </div>

      {/* Retention Curve */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Retention Curve</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Percentage of users still active over time (benchmark: 40% at day 30)
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="days" label={{ value: 'Days Since Registration', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="retention" 
              stroke="#F58634" 
              strokeWidth={2} 
              name="User Retention"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey={() => 40} 
              stroke="#E63946" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              name="Industry Benchmark"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Churn Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Churn Reasons</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={churnReasonsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {churnReasonsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Churn Rate by Cohort</h2>
          <div className="space-y-3">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Last 30 days</span>
                <span className="text-sm text-danger font-medium">45%</span>
              </div>
              <div className="flex-1 bg-neutral-200 rounded-full h-2">
                <div className="bg-danger h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Last 60 days</span>
                <span className="text-sm text-warning font-medium">38%</span>
              </div>
              <div className="flex-1 bg-neutral-200 rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{ width: '38%' }} />
              </div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Last 90 days</span>
                <span className="text-sm text-success font-medium">32%</span>
              </div>
              <div className="flex-1 bg-neutral-200 rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '32%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win-Back Campaigns */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Win-Back Campaign Candidates</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Users not active for 30+ days - suggested re-engagement actions
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Days Inactive</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Program Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Suggested Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {winBackUsers.slice(0, 20).map((user: any) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-neutral-dark">{user.name}</p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.lastActive ? user.lastActive.toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">
                      {user.daysSinceActive || 'N/A'} days
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">Day {user.programProgress}/10</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-600">{user.suggestedAction}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="btn-primary text-sm">
                      Send Email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {winBackUsers.length > 20 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-500">
              Showing 20 of {winBackUsers.length} churned users
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
