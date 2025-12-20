import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, TrendingUp, TrendingDown, Eye, Edit, Trash2, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Segment {
  id: string
  name: string
  description: string
  criteria: any
  userCount: number
  trend?: number
  isPredefined: boolean
}

const predefinedSegments = [
  {
    id: 'active',
    name: 'Active Users',
    description: 'Users who logged in within the last 7 days',
    criteria: { lastLoginDays: 7 },
    isPredefined: true,
  },
  {
    id: 'inactive',
    name: 'Inactive Users',
    description: 'Users who have not logged in for 30+ days',
    criteria: { lastLoginDays: 30 },
    isPredefined: true,
  },
  {
    id: 'high-risk',
    name: 'High Risk',
    description: 'Users with many slips and low session completion',
    criteria: { slipsThreshold: 3, completionRate: 0.5 },
    isPredefined: true,
  },
  {
    id: 'star-performers',
    name: 'Star Performers',
    description: 'Users who completed the program with no slips',
    criteria: { slipsThreshold: 0, programCompleted: true },
    isPredefined: true,
  },
  {
    id: 'new-users',
    name: 'New Users',
    description: 'Users registered within the last 7 days',
    criteria: { registrationDays: 7 },
    isPredefined: true,
  },
  {
    id: 'churned',
    name: 'Churned',
    description: 'Users not active for 90+ days',
    criteria: { lastLoginDays: 90 },
    isPredefined: true,
  },
]

export const UserSegments = () => {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('users'),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
  })

  const { data: cravingsData } = useQuery({
    queryKey: ['cravings', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('cravings'),
  })

  const calculateSegmentCount = (segmentId: string, periodDays?: number): number => {
    if (!usersData?.data) return 0
    const users = usersData.data
    const sessions = sessionsData?.data || []
    const cravings = cravingsData?.data || []
    const now = new Date()
    const period = periodDays || (segmentId === 'active' ? 7 : segmentId === 'inactive' ? 30 : segmentId === 'new-users' ? 7 : segmentId === 'churned' ? 90 : 0)

    switch (segmentId) {
      case 'active':
        const daysAgo = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
        return users.filter((u: any) => {
          if (!u.lastActive) return false
          return new Date(u.lastActive) > daysAgo
        }).length

      case 'inactive':
        const daysAgoInactive = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
        return users.filter((u: any) => {
          if (!u.lastActive) return true
          return new Date(u.lastActive) < daysAgoInactive
        }).length

      case 'high-risk':
        return users.filter((u: any) => {
          const userSessions = sessions.filter((s: any) => s.user === u.id)
          const userCravings = cravings.filter((c: any) => c.user === u.id)
          const slips = userCravings.filter((c: any) => c.type === 'slip').length
          const completedSessions = userSessions.filter((s: any) => s.status === 'completed').length
          return slips > 3 && completedSessions < 5
        }).length

      case 'star-performers':
        return users.filter((u: any) => {
          const userSessions = sessions.filter((s: any) => s.user === u.id)
          const userCravings = cravings.filter((c: any) => c.user === u.id)
          const completed = userSessions.filter((s: any) => s.status === 'completed').length
          const slips = userCravings.filter((c: any) => c.type === 'slip').length
          return completed >= 10 && slips === 0
        }).length

      case 'new-users':
        const daysAgoNew = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
        return users.filter((u: any) => {
          if (!u.created) return false
          return new Date(u.created) > daysAgoNew
        }).length

      case 'churned':
        const daysAgoChurned = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
        return users.filter((u: any) => {
          if (!u.lastActive) return true
          return new Date(u.lastActive) < daysAgoChurned
        }).length

      default:
        return 0
    }
  }

  // Calculate trend: compare current period with previous period
  const calculateTrend = (segmentId: string): number => {
    const currentCount = calculateSegmentCount(segmentId)
    
    // For time-based segments, compare with previous period
    if (['active', 'inactive', 'new-users', 'churned'].includes(segmentId)) {
      const periodDays = segmentId === 'active' ? 7 : segmentId === 'inactive' ? 30 : segmentId === 'new-users' ? 7 : 90
      const previousPeriodStart = new Date()
      previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays * 2)
      const previousPeriodEnd = new Date()
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodDays)
      
      let previousCount = 0
      if (segmentId === 'active' || segmentId === 'inactive') {
        // For active/inactive, count users active in previous period
        previousCount = usersData?.data?.filter((u: any) => {
          if (!u.lastActive) return segmentId === 'inactive'
          const lastActive = new Date(u.lastActive)
          if (segmentId === 'active') {
            return lastActive > previousPeriodEnd && lastActive <= previousPeriodStart
          } else {
            return lastActive < previousPeriodEnd && lastActive >= previousPeriodStart
          }
        }).length || 0
      } else if (segmentId === 'new-users') {
        previousCount = usersData?.data?.filter((u: any) => {
          if (!u.created) return false
          const created = new Date(u.created)
          return created > previousPeriodStart && created <= previousPeriodEnd
        }).length || 0
      } else if (segmentId === 'churned') {
        previousCount = usersData?.data?.filter((u: any) => {
          if (!u.lastActive) return true
          const lastActive = new Date(u.lastActive)
          return lastActive < previousPeriodEnd && lastActive >= previousPeriodStart
        }).length || 0
      }
      
      if (previousCount === 0) return currentCount > 0 ? 100 : 0
      return Math.round(((currentCount - previousCount) / previousCount) * 100)
    }
    
    // For non-time-based segments, return 0 (no trend available)
    return 0
  }

  const segments: Segment[] = predefinedSegments.map(seg => ({
    ...seg,
    criteria: seg.criteria || {},
    userCount: calculateSegmentCount(seg.id),
    trend: calculateTrend(seg.id),
  }))

  const handleViewUsers = (segmentId: string) => {
    // Navigate to users page with segment filter
    navigate(`/users?segment=${segmentId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold text-neutral-dark">User Segments</h1>
          <p className="text-neutral-500 mt-1">Create and manage user cohorts for targeted actions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Custom Segment
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <div key={segment.id} className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-dark mb-1">{segment.name}</h3>
                <p className="text-sm text-neutral-500">{segment.description}</p>
              </div>
              {!segment.isPredefined && (
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-neutral-100 rounded">
                    <Edit className="w-4 h-4 text-primary" />
                  </button>
                  <button className="p-1 hover:bg-neutral-100 rounded">
                    <Trash2 className="w-4 h-4 text-danger" />
                  </button>
                </div>
              )}
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-neutral-dark">{segment.userCount}</span>
                <span className="text-sm text-neutral-500">users</span>
              </div>
              {segment.trend !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${
                  segment.trend > 0 ? 'text-success' : segment.trend < 0 ? 'text-danger' : 'text-neutral-500'
                }`}>
                  {segment.trend > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : segment.trend < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : null}
                  <span>{segment.trend > 0 ? '+' : ''}{segment.trend}% vs last period</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
              <button
                onClick={() => handleViewUsers(segment.id)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <Eye className="w-4 h-4" />
                View Users
              </button>
              {!segment.isPredefined && (
                <button className="btn-secondary flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Segment Modal placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Create Custom Segment</h2>
            <p className="text-neutral-500 mb-4">Segment builder interface will be implemented here</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary">Save Segment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
