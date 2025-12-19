import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Search, Filter, Download, Award, User, Calendar, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const AchievementLogs = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [achievementFilter, setAchievementFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['user_achievements', 'logs', achievementFilter, dateRange],
    queryFn: () => adminCollectionHelpers.getFullList('user_achievements', {
      filter: buildFilter(),
      sort: '-unlocked_at',
      expand: 'user,achievement',
    }),
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('achievements'),
  })

  const buildFilter = () => {
    const filters: string[] = []
    if (achievementFilter !== 'all') {
      filters.push(`achievement = "${achievementFilter}"`)
    }
    if (dateRange.start) {
      filters.push(`unlocked_at >= "${dateRange.start}"`)
    }
    if (dateRange.end) {
      filters.push(`unlocked_at <= "${dateRange.end}"`)
    }
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const logs = logsData?.data || []
  const achievements = achievementsData?.data || []

  const filteredLogs = logs.filter((log: any) => {
    if (!searchQuery) return true
    const user = log.expand?.user
    const achievement = log.expand?.achievement
    const searchLower = searchQuery.toLowerCase()
    return (
      user?.name?.toLowerCase().includes(searchLower) ||
      user?.email?.toLowerCase().includes(searchLower) ||
      achievement?.title?.toLowerCase().includes(searchLower)
    )
  })

  const handleExportCSV = () => {
    const headers = ['User', 'Email', 'Achievement', 'Unlocked Date', 'Unlock Method']
    const rows = filteredLogs.map((log: any) => [
      log.expand?.user?.name || '',
      log.expand?.user?.email || '',
      log.expand?.achievement?.title || '',
      log.unlocked_at ? new Date(log.unlocked_at).toLocaleString() : '',
      log.unlock_method || 'Automatic',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `achievement-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold text-neutral-dark">Achievement Logs</h1>
          <p className="text-neutral-500 mt-1">Audit trail of all achievement unlocks</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user name, email, or achievement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={achievementFilter}
            onChange={(e) => setAchievementFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Achievements</option>
            {achievements.map((ach: any) => (
              <option key={ach.id} value={ach.id}>{ach.title}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Start date"
            />
            <span className="text-neutral-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No achievement logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Achievement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Unlocked Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Unlock Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                          {log.expand?.user?.name?.[0]?.toUpperCase() || log.expand?.user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-dark">
                            {log.expand?.user?.name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-neutral-500">{log.expand?.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{log.expand?.achievement?.icon || '🏆'}</span>
                        <div>
                          <p className="font-medium text-neutral-dark">
                            {log.expand?.achievement?.title || 'Unknown Achievement'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                            log.expand?.achievement?.tier === 'bronze' ? 'bg-amber-100 text-amber-800' :
                            log.expand?.achievement?.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                            log.expand?.achievement?.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                            log.expand?.achievement?.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                            'bg-neutral-100 text-neutral-800'
                          }`}>
                            {log.expand?.achievement?.tier || 'bronze'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="font-medium">
                            {log.unlocked_at ? new Date(log.unlocked_at).toLocaleDateString() : '-'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {log.unlocked_at ? formatDistanceToNow(new Date(log.unlocked_at), { addSuffix: true }) : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 w-fit ${
                        log.unlock_method === 'manual' || log.reason
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      }`}>
                        {log.unlock_method === 'manual' || log.reason ? (
                          <>
                            <User className="w-3 h-3" />
                            Manual
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Automatic
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {log.reason || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => window.location.href = `/users/${log.expand?.user?.id}`}
                        className="text-primary text-sm hover:underline"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
