import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import {
  daysSinceLastActive,
  getUserLastActive,
  countActiveUsers,
} from '../../lib/userActivity'
import { fetchActivityByUser } from '../../lib/fetchActivityByUser'
import {
  retentionCurvePoints,
  signupMonthCohorts,
} from '../../lib/analyticsHelpers'
import { buildWinBackEmail, sendUserPushNotification } from '../../lib/sendPush'
import { TrendingDown, Users, Download, AlertCircle, Bell, Mail } from 'lucide-react'
import { D3MultiLineChart, D3Donut, ENGAGE_COLORS } from '../../components/charts/D3EngageCharts'
export const RetentionReports = () => {
  // Horizon for curve + inactive / win-back threshold
  const [inactiveDays, setInactiveDays] = useState<30 | 60 | 90 | 180>(30)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('users'),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
  })

  const { data: activityByUser = new Map<string, number>() } = useQuery({
    queryKey: ['activity-by-user'],
    queryFn: fetchActivityByUser,
    staleTime: 60_000,
  })

  const { data: programDaysData } = useQuery({
    queryKey: ['program_days', 'max'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('program_days', {
        fields: 'day_number',
        sort: 'day_number',
      }),
  })

  const { data: deletionData } = useQuery({
    queryKey: ['account_deletion_requests', 'reasons'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('account_deletion_requests', {
        fields: 'id,reason,status',
      }),
    retry: false,
  })

  const { data: pushSubsData } = useQuery({
    queryKey: ['push_subscriptions', 'active'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('push_subscriptions', {
        filter: 'active=true',
        fields: 'id,user,active',
      }),
    staleTime: 60_000,
  })

  const usersWithPush = new Set(
    (pushSubsData?.data || []).map((s: any) => s.user).filter(Boolean)
  )
  const maxProgramDay = Math.max(
    1,
    ...(programDaysData?.data || []).map((d: any) => d.day_number || 0)
  )

  const users = usersData?.data || []
  const sessions = sessionsData?.data || []

  const curveMaxDays = Math.max(30, inactiveDays)
  const retentionData = retentionCurvePoints(
    users,
    activityByUser,
    curveMaxDays,
    Math.max(1, Math.floor(curveMaxDays / 20))
  )

  // Align with isUserActiveWithinDays(days): active = daysSince < threshold
  const neverActivated = users.filter(
    (u: any) => daysSinceLastActive(u, activityByUser) === null
  )
  const activeCount = countActiveUsers(users, activityByUser, inactiveDays)
  const inactiveUsers = users.filter((u: any) => {
    const daysSince = daysSinceLastActive(u, activityByUser)
    return daysSince !== null && daysSince >= inactiveDays
  })
  const activated = users.length - neverActivated.length
  const inactiveRate =
    activated > 0 ? Math.round((inactiveUsers.length / activated) * 100) : 0

  const monthCohorts = signupMonthCohorts(users, activityByUser, 6)

  const deletionReasonsData = (() => {
    const rows = (deletionData?.data || []) as any[]
    if (!rows.length) return null
    const reasons: Record<string, number> = {}
    for (const row of rows) {
      const reason = (row.reason || '').trim() || 'No reason given'
      reasons[reason] = (reasons[reason] || 0) + 1
    }
    return Object.entries(reasons)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  })()

  const sessionsByUser = (() => {
    const map = new Map<string, any[]>()
    for (const s of sessions as any[]) {
      if (!s.user) continue
      if (!map.has(s.user)) map.set(s.user, [])
      map.get(s.user)!.push(s)
    }
    return map
  })()

  const winBackUsers = inactiveUsers
    .map((user: any) => {
      const userSessions = sessionsByUser.get(user.id) || []
      const day = userSessions.reduce(
        (max: number, s: any) => Math.max(max, Number(s.current_day) || 0),
        0
      )
      const last = getUserLastActive(user, activityByUser.get(user.id))
      const daysSince = daysSinceLastActive(user, activityByUser)
      const hasPush = usersWithPush.has(user.id)

      return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        lastActive: last,
        daysSinceActive: daysSince,
        programProgress: day,
        hasPush,
        suggestedAction: !hasPush
          ? 'Email only (no app push enabled)'
          : day < 3
            ? 'Send push + email'
            : 'Offer incentive + push',
      }
    })
    .sort((a, b) => (b.daysSinceActive ?? 0) - (a.daysSinceActive ?? 0))

  const exportWinBackCsv = () => {
    const header = 'id,name,email,days_inactive,program_day,last_active'
    const lines = winBackUsers.map((u) =>
      [
        u.id,
        JSON.stringify(u.name || ''),
        u.email || '',
        u.daysSinceActive ?? '',
        u.programProgress,
        u.lastActive ? u.lastActive.toISOString() : '',
      ].join(',')
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `winback-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendEmail = (user: (typeof winBackUsers)[number]) => {
    const { mailto } = buildWinBackEmail(user)
    window.open(mailto, '_blank')
  }

  const sendPush = async (user: (typeof winBackUsers)[number]) => {
    const day = user.programProgress || 1
    const first = String(user.name || 'there').split(' ')[0]
    setActionBusy(user.id)
    setActionMsg(null)
    const result = await sendUserPushNotification({
      userId: user.id,
      title: 'Your quit journey is waiting',
      body: `Hi ${first} — Day ${day} is still here when you're ready. Open the app to continue.`,
      url: '/home',
      tag: 'winback',
      dayNumber: day,
    })
    setActionBusy(null)
    setActionMsg(
      result.ok
        ? `Push sent to ${user.email || user.name} (${result.sent} device${result.sent === 1 ? '' : 's'})`
        : `Push failed: ${result.error}`
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-dark">Retention Reports</h1>
        <div className="flex items-center gap-3">
          <select
            value={inactiveDays}
            onChange={(e) => setInactiveDays(Number(e.target.value) as 30 | 60 | 90 | 180)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            title="Inactive threshold for KPIs, win-back list, and curve horizon"
          >
            <option value={30}>Inactive after 30 days</option>
            <option value={60}>Inactive after 60 days</option>
            <option value={90}>Inactive after 90 days</option>
            <option value={180}>Inactive after 180 days</option>
          </select>
          <button
            type="button"
            onClick={exportWinBackCsv}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Win-Back CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Inactive rate</span>
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{inactiveRate}%</p>
          <p className="text-xs text-neutral-500 mt-1">
            {inactiveUsers.length} inactive {inactiveDays}+ days · {neverActivated.length} never
            activated · of {activated} activated
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Active users</span>
            <Users className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{activeCount}</p>
          <p className="text-xs text-neutral-500 mt-1">
            Real activity within last {inactiveDays} days
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Win-back candidates</span>
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
          <p className="text-3xl font-bold text-neutral-dark">{winBackUsers.length}</p>
          <p className="text-xs text-neutral-500 mt-1">
            Activated users quiet for {inactiveDays}+ days
          </p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-white/60 p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[#0E2538]">Retention curve</h2>
        <p className="text-sm text-[#4A6574] mb-4">
          Of users old enough to reach day N, % whose latest activity is on or after day N since
          signup. (Survivorship-style — not same-calendar-day industry D7.)
        </p>
        <D3MultiLineChart
          data={retentionData.map((d: { days: number; retention: number }) => ({
            days: `D${d.days}`,
            retention: d.retention,
          }))}
          xKey="days"
          height={360}
          yDomain={[0, 100]}
          ySuffix="%"
          series={[{ key: 'retention', label: 'User Retention', color: '#3F8DD2' }]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-white/60 p-6">
          <h2 className="text-lg font-semibold tracking-tight mb-4 text-[#0E2538]">Account deletion reasons</h2>
          <p className="text-sm text-[#4A6574] mb-4">
            Exit survey from deletion requests — not the same as inactive users above.
          </p>
          {deletionReasonsData ? (
            <D3Donut
              data={deletionReasonsData}
              height={300}
              colors={ENGAGE_COLORS}
              centerLabel="Reasons"
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[#4A6574]">
              <p className="text-sm">No account deletion reasons yet.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Retention by signup month</h2>
          <p className="text-sm text-neutral-500 mb-4">
            D7 / D30 = % of that month&apos;s signups with activity on or after day 7 / 30.
          </p>
          <div className="space-y-3">
            {monthCohorts.map((cohort) => (
              <div key={cohort.label} className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cohort.label}</span>
                  <span className="text-xs text-neutral-500">{cohort.total} signups</span>
                </div>
                {cohort.total === 0 ? (
                  <p className="text-xs text-neutral-400">No signups</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-500">D7</span>
                        <span className="font-medium">{cohort.d7}%</span>
                      </div>
                      <div className="bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.min(100, cohort.d7)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-500">D30</span>
                        <span className="font-medium">
                          {cohort.matureEnoughForD30 ? `${cohort.d30}%` : '—'}
                        </span>
                      </div>
                      <div className="bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-secondary h-2 rounded-full"
                          style={{
                            width: cohort.matureEnoughForD30
                              ? `${Math.min(100, cohort.d30)}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Win-back campaign candidates</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Users with prior activity who have been quiet for {inactiveDays}+ days. Email opens your
          mail client; push uses their Web Push subscription.
        </p>
        {actionMsg && (
          <div className="mb-4 p-3 rounded-lg bg-neutral-50 text-sm text-neutral-700 border border-neutral-200">
            {actionMsg}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Days Inactive
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Program Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Suggested Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {winBackUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No win-back candidates at this threshold.
                  </td>
                </tr>
              ) : (
                winBackUsers.slice(0, 20).map((user) => (
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
                        {user.daysSinceActive != null ? `${user.daysSinceActive} days` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        Day {user.programProgress}/{maxProgramDay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-600">{user.suggestedAction}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => sendEmail(user)}
                          disabled={!user.email}
                          className="btn-secondary text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => sendPush(user)}
                          disabled={actionBusy === user.id || !user.hasPush}
                          title={
                            user.hasPush
                              ? 'Send web push to their device'
                              : 'User has not enabled app notifications'
                          }
                          className="btn-primary text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          {actionBusy === user.id ? 'Sending…' : user.hasPush ? 'Notify' : 'No push'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {winBackUsers.length > 20 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-500">
              Showing 20 of {winBackUsers.length} candidates (export CSV for full list)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
