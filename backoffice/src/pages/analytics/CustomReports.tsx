import { useState } from 'react'
import { Download, BarChart3, Play } from 'lucide-react'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { countActiveUsers } from '../../lib/userActivity'
import { fetchActivityByUser } from '../../lib/fetchActivityByUser'
import { distinctUsers } from '../../lib/analyticsHelpers'

type MetricRow = { metric: string; value: string | number }

const COLLECTION_MAP: Record<string, string> = {
  users: 'users',
  sessions: 'user_sessions',
  cravings: 'cravings',
  journal_entries: 'journal_entries',
  achievements: 'user_achievements',
}

export const CustomReports = () => {
  const [dataSource, setDataSource] = useState('users')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Count'])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<MetricRow[] | null>(null)

  const metricOptions: Record<string, string[]> = {
    users: ['Count', 'Active Users (7d)', 'Registration Trend (30d)'],
    sessions: ['Count', 'Completion Rate', 'In Progress'],
    cravings: ['Count', 'Intensity Distribution', 'Trigger Breakdown', 'Slip Rate'],
    journal_entries: ['Count', 'Mood Distribution', 'Entries per User'],
    achievements: ['Total Unlocks', 'Most Popular'],
  }

  const runReport = async () => {
    if (!selectedMetrics.length) {
      setError('Select at least one metric')
      return
    }
    setRunning(true)
    setError(null)
    try {
      const collection = COLLECTION_MAP[dataSource]
      const rows: MetricRow[] = []

      if (dataSource === 'users') {
        const usersRes = await adminCollectionHelpers.getFullList('users')
        const users = usersRes.data || []
        if (selectedMetrics.includes('Count')) rows.push({ metric: 'Count', value: users.length })
        if (selectedMetrics.includes('Active Users (7d)')) {
          const activity = await fetchActivityByUser()
          rows.push({
            metric: 'Active Users (7d)',
            value: countActiveUsers(users, activity, 7),
          })
        }
        if (selectedMetrics.includes('Registration Trend (30d)')) {
          const since = new Date()
          since.setDate(since.getDate() - 30)
          const n = users.filter((u: any) => u.created && new Date(u.created) >= since).length
          rows.push({ metric: 'Registrations (30d)', value: n })
        }
      } else if (dataSource === 'sessions') {
        const res = await adminCollectionHelpers.getFullList('user_sessions')
        const sessions = res.data || []
        if (selectedMetrics.includes('Count')) rows.push({ metric: 'Count', value: sessions.length })
        if (selectedMetrics.includes('Completion Rate')) {
          const done = sessions.filter((s: any) => s.status === 'completed').length
          rows.push({
            metric: 'Completion Rate',
            value: sessions.length
              ? `${Math.round((done / sessions.length) * 100)}%`
              : '0%',
          })
        }
        if (selectedMetrics.includes('In Progress')) {
          rows.push({
            metric: 'In Progress',
            value: sessions.filter((s: any) => s.status === 'in_progress').length,
          })
        }
      } else if (dataSource === 'cravings') {
        const res = await adminCollectionHelpers.getFullList('cravings')
        const cravings = res.data || []
        if (selectedMetrics.includes('Count')) rows.push({ metric: 'Count', value: cravings.length })
        if (selectedMetrics.includes('Slip Rate')) {
          const slips = cravings.filter((c: any) => c.type === 'slip').length
          rows.push({
            metric: 'Slip Rate',
            value: cravings.length
              ? `${Math.round((slips / cravings.length) * 100)}%`
              : '0%',
          })
        }
        if (selectedMetrics.includes('Intensity Distribution')) {
          const dist = [1, 2, 3, 4, 5]
            .map((i) => `${i}:${cravings.filter((c: any) => c.intensity === i).length}`)
            .join(' · ')
          rows.push({ metric: 'Intensity Distribution', value: dist || '—' })
        }
        if (selectedMetrics.includes('Trigger Breakdown')) {
          const map: Record<string, number> = {}
          for (const c of cravings as any[]) {
            const t = c.trigger || 'other'
            map[t] = (map[t] || 0) + 1
          }
          rows.push({
            metric: 'Trigger Breakdown',
            value:
              Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => `${k}:${v}`)
                .join(' · ') || '—',
          })
        }
      } else if (dataSource === 'journal_entries') {
        const res = await adminCollectionHelpers.getFullList('journal_entries')
        const entries = res.data || []
        if (selectedMetrics.includes('Count')) rows.push({ metric: 'Count', value: entries.length })
        if (selectedMetrics.includes('Mood Distribution')) {
          const map: Record<string, number> = {}
          for (const e of entries as any[]) {
            const m = e.mood || 'neutral'
            map[m] = (map[m] || 0) + 1
          }
          rows.push({
            metric: 'Mood Distribution',
            value:
              Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => `${k}:${v}`)
                .join(' · ') || '—',
          })
        }
        if (selectedMetrics.includes('Entries per User')) {
          const users = distinctUsers(entries as any).size || 1
          rows.push({
            metric: 'Entries per User',
            value: Math.round((entries.length / users) * 10) / 10,
          })
        }
      } else if (dataSource === 'achievements') {
        const res = await adminCollectionHelpers.getFullList('user_achievements', {
          expand: 'achievement',
        })
        const unlocks = res.data || []
        if (selectedMetrics.includes('Total Unlocks')) {
          rows.push({ metric: 'Total Unlocks', value: unlocks.length })
        }
        if (selectedMetrics.includes('Most Popular')) {
          const map: Record<string, number> = {}
          for (const u of unlocks as any[]) {
            const title = u.expand?.achievement?.title || 'Unknown'
            map[title] = (map[title] || 0) + 1
          }
          const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0]
          rows.push({
            metric: 'Most Popular',
            value: top ? `${top[0]} (${top[1]})` : '—',
          })
        }
      } else {
        const res = await adminCollectionHelpers.getFullList(collection)
        rows.push({ metric: 'Count', value: (res.data || []).length })
      }

      setResults(rows)
    } catch (e: any) {
      setError(e?.message || 'Failed to run report')
      setResults(null)
    } finally {
      setRunning(false)
    }
  }

  const exportCsv = () => {
    if (!results?.length) return
    const csv = ['metric,value', ...results.map((r) => `${JSON.stringify(r.metric)},${JSON.stringify(String(r.value))}`)].join(
      '\n'
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${dataSource}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark">Custom Reports</h1>
        <p className="text-neutral-500 mt-1">
          Run live metrics from PocketBase. Select a source and metrics, then run.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Data source</label>
          <select
            value={dataSource}
            onChange={(e) => {
              setDataSource(e.target.value)
              setSelectedMetrics(['Count'])
              setResults(null)
            }}
            className="w-full max-w-md px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.keys(metricOptions).map((key) => (
              <option key={key} value={key}>
                {key.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Metrics</label>
          <div className="space-y-2">
            {metricOptions[dataSource].map((metric) => (
              <label key={metric} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedMetrics([...selectedMetrics, metric])
                    else setSelectedMetrics(selectedMetrics.filter((m) => m !== metric))
                  }}
                  className="rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700">{metric}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runReport}
            disabled={running}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {running ? (
              'Running…'
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run report
              </>
            )}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!results?.length}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>
        )}

        {results && (
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {results.map((row) => (
                  <tr key={row.metric}>
                    <td className="px-4 py-3 text-sm font-medium">{row.metric}</td>
                    <td className="px-4 py-3 text-sm">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!results && !error && (
          <div className="text-center py-10 text-neutral-500">
            <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm">Pick metrics and click Run report</p>
          </div>
        )}
      </div>
    </div>
  )
}
