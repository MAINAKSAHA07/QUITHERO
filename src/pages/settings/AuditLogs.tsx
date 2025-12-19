import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Search, Filter, Download, FileText, User, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AuditLog {
  id: string
  timestamp: string
  admin_user: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  ip_address?: string
  user_agent?: string
  [key: string]: any
}

export const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all')
  const [adminFilter, setAdminFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  // Note: Audit logs would be in an 'audit_logs' collection
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit_logs', actionTypeFilter, adminFilter, dateRange],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('audit_logs', {
          filter: buildFilter(),
          sort: '-timestamp',
          expand: 'admin_user',
        })
      } catch (error: any) {
        // If collection doesn't exist, return empty
        return { data: [] }
      }
    },
  })

  const buildFilter = () => {
    const filters: string[] = []
    if (searchQuery) {
      filters.push(`action ~ "${searchQuery}" || entity_type ~ "${searchQuery}"`)
    }
    if (actionTypeFilter !== 'all') {
      filters.push(`action_type = "${actionTypeFilter}"`)
    }
    if (adminFilter !== 'all') {
      filters.push(`admin_user = "${adminFilter}"`)
    }
    if (dateRange.start) {
      filters.push(`timestamp >= "${dateRange.start}"`)
    }
    if (dateRange.end) {
      filters.push(`timestamp <= "${dateRange.end}"`)
    }
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const logs = logsData?.data || []

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Admin', 'Action', 'Entity Type', 'Entity ID', 'IP Address']
    const rows = logs.map((log: AuditLog) => [
      log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
      log.expand?.admin_user?.name || log.admin_user || '',
      log.action || '',
      log.entity_type || '',
      log.entity_id || '',
      log.ip_address || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'user_management', label: 'User Management' },
    { value: 'content_management', label: 'Content Management' },
    { value: 'settings_changes', label: 'Settings Changes' },
    { value: 'support_actions', label: 'Support Actions' },
    { value: 'deletions', label: 'Deletions' },
    { value: 'login_logout', label: 'Login/Logout' },
    { value: 'permission_changes', label: 'Permission Changes' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Audit Logs</h1>
          <p className="text-neutral-500 mt-1">Track all administrative actions for security and compliance</p>
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
              placeholder="Search by action, entity type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {actionTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
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
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No audit logs found</p>
            <p className="text-sm text-neutral-400 mt-2">
              {logsData === undefined
                ? 'Audit logs collection may need to be created in PocketBase'
                : 'Administrative actions will be logged here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Admin User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Entity Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Entity ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {logs.map((log: AuditLog) => {
                  const isExpanded = expandedLogs.has(log.id)
                  return (
                    <>
                      <tr key={log.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => toggleExpand(log.id)}>
                        <td className="px-6 py-4">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {log.expand?.admin_user?.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <span className="text-sm">{log.expand?.admin_user?.name || log.admin_user || 'System'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{log.action || '-'}</td>
                        <td className="px-6 py-4 text-sm text-neutral-600 capitalize">
                          {log.entity_type?.replace(/_/g, ' ') || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono">
                            {log.entity_id?.slice(0, 8) || '-'}...
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500 font-mono">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-neutral-50">
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-neutral-500">Details:</label>
                                <pre className="text-xs bg-white p-3 rounded border border-neutral-200 overflow-x-auto">
                                  {JSON.stringify(log.details || {}, null, 2)}
                                </pre>
                              </div>
                              {log.user_agent && (
                                <div>
                                  <label className="text-xs text-neutral-500">User Agent:</label>
                                  <p className="text-xs text-neutral-600">{log.user_agent}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
