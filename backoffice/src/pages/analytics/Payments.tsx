import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CreditCard, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'

type PaymentEvent = {
  id: string
  event_id?: string
  event?: string
  payment_id?: string
  order_id?: string
  refund_id?: string
  status?: string
  amount?: number
  currency?: string
  method?: string
  email?: string
  contact?: string
  user?: string
  created?: string
  expand?: {
    user?: { id: string; email?: string; name?: string }
  }
}

function formatAmount(amount?: number, currency?: string) {
  if (amount == null || Number.isNaN(amount)) return '—'
  const cur = (currency || 'INR').toUpperCase()
  const zeroDecimal = new Set(['JPY', 'KRW', 'VND'])
  const major = zeroDecimal.has(cur) ? amount : amount / 100
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: zeroDecimal.has(cur) ? 0 : 2,
    }).format(major)
  } catch {
    return `${cur} ${major}`
  }
}

function safeRelative(value?: string) {
  if (!value?.trim()) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}

const EVENT_FILTERS = [
  { value: 'all', label: 'All events' },
  { value: 'payment.captured', label: 'Captured' },
  { value: 'payment.authorized', label: 'Authorized' },
  { value: 'payment.failed', label: 'Failed' },
  { value: 'order.paid', label: 'Order paid' },
  { value: 'refund', label: 'Refunds' },
  { value: 'dispute', label: 'Disputes' },
]

export function Payments() {
  const [eventFilter, setEventFilter] = useState('all')

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payment_events', eventFilter],
    queryFn: async () => {
      let filter: string | undefined
      if (eventFilter === 'refund') filter = 'event ~ "refund."'
      else if (eventFilter === 'dispute') filter = 'event ~ "dispute"'
      else if (eventFilter !== 'all') filter = `event = "${eventFilter}"`

      return adminCollectionHelpers.getFullList('payment_events', {
        filter,
        sort: recentSort('payment_events'),
        expand: 'user',
      })
    },
  })

  const rows = (data?.data || []) as unknown as PaymentEvent[]

  const stats = useMemo(() => {
    const captured = rows.filter((r) => r.event === 'payment.captured' || r.event === 'order.paid')
    const failed = rows.filter((r) => r.event === 'payment.failed')
    const totalMinor = captured.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const currency = captured[0]?.currency || 'INR'
    return {
      count: rows.length,
      captured: captured.length,
      failed: failed.length,
      totalLabel: formatAmount(totalMinor || undefined, currency),
    }
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Payments
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Razorpay webhook events — live feed for checkout, captures, failures, and refunds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50"
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Events shown</p>
          <p className="text-xl font-semibold mt-1">{stats.count}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Captured / paid</p>
          <p className="text-xl font-semibold mt-1 text-emerald-600">{stats.captured}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Failed</p>
          <p className="text-xl font-semibold mt-1 text-red-600">{stats.failed}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Captured volume (page)</p>
          <p className="text-xl font-semibold mt-1">{stats.totalLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-neutral-400" />
        {EVENT_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setEventFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              eventFilter === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {isLoading && <p className="p-6 text-sm text-neutral-500">Loading payment events…</p>}
        {error && (
          <p className="p-6 text-sm text-red-600">
            Could not load payments. Run <code className="text-xs">npm run pb:setup-payment-events</code> if
            the collection is missing.
          </p>
        )}
        {!isLoading && !error && rows.length === 0 && (
          <p className="p-6 text-sm text-neutral-500">
            No webhook events yet. Point Razorpay at{' '}
            <code className="text-xs bg-neutral-100 px-1 rounded">https://app.smono.app/api/razorpay/webhook</code>{' '}
            and complete a test payment.
          </p>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment / Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100 hover:bg-neutral-50/80">
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {safeRelative(row.created)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-neutral-900">{row.event || '—'}</span>
                      {row.method && (
                        <span className="block text-xs text-neutral-400 mt-0.5">{row.method}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatAmount(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-xs px-2 py-0.5 rounded-full ${
                          row.status === 'captured' || row.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.status === 'failed'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {row.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                      <div>{row.payment_id || '—'}</div>
                      <div className="text-neutral-400">{row.order_id || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.email || '—'}</div>
                      <div className="text-xs text-neutral-400">{row.contact || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      {row.user ? (
                        <Link
                          to={`/users/${row.user}`}
                          className="text-primary hover:underline"
                        >
                          {row.expand?.user?.email || row.expand?.user?.name || 'View'}
                        </Link>
                      ) : (
                        <span className="text-neutral-400">Guest</span>
                      )}
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
