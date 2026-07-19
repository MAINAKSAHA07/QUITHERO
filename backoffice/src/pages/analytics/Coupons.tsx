import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, Pencil, Trash2, X } from 'lucide-react'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'

type Coupon = {
  id: string
  code: string
  percent_off: number
  active?: boolean
  max_redemptions?: number
  redeemed_count?: number
  valid_from?: string
  valid_until?: string
  notes?: string
}

type FormState = {
  code: string
  percent_off: string
  active: boolean
  max_redemptions: string
  valid_from: string
  valid_until: string
  notes: string
}

const emptyForm = (): FormState => ({
  code: '',
  percent_off: '20',
  active: true,
  max_redemptions: '0',
  valid_from: '',
  valid_until: '',
  notes: '',
})

function dateInputValue(raw?: string) {
  if (!raw) return ''
  return String(raw).slice(0, 10)
}

function toPayload(form: FormState) {
  const code = form.code.trim().toUpperCase()
  const percent = Number(form.percent_off)
  if (!code) throw new Error('Code is required')
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
    throw new Error('Percent must be 1–100')
  }
  return {
    code,
    percent_off: percent,
    active: form.active,
    max_redemptions: Math.max(0, Math.floor(Number(form.max_redemptions) || 0)),
    redeemed_count: undefined as number | undefined,
    valid_from: form.valid_from || null,
    valid_until: form.valid_until || null,
    notes: form.notes.trim() || '',
  }
}

export function Coupons() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(emptyForm())
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['coupons'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('coupons', {
        sort: recentSort('coupons'),
      }),
  })

  const rows = (data?.data || []) as unknown as Coupon[]

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toPayload(form)
      if (editing) {
        const { redeemed_count: _rc, ...rest } = payload
        return adminCollectionHelpers.update('coupons', editing.id, rest)
      }
      return adminCollectionHelpers.create('coupons', {
        ...payload,
        redeemed_count: 0,
        redeemed_orders: [],
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setOpen(false)
      setEditing(null)
      setForm(emptyForm())
      setError('')
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to save coupon')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCollectionHelpers.delete('coupons', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminCollectionHelpers.update('coupons', id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setError('')
    setOpen(true)
  }

  const openEdit = (row: Coupon) => {
    setEditing(row)
    setForm({
      code: row.code || '',
      percent_off: String(row.percent_off ?? 20),
      active: row.active !== false,
      max_redemptions: String(row.max_redemptions ?? 0),
      valid_from: dateInputValue(row.valid_from),
      valid_until: dateInputValue(row.valid_until),
      notes: row.notes || '',
    })
    setError('')
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            Coupons
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Percent-off codes applied at checkout. Server validates — clients cannot set the price.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New coupon
        </button>
      </div>

      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Could not load coupons. Run <code className="text-xs">npm run pb:setup-coupons</code> if
          the collection is missing.
        </p>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-neutral-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No coupons yet. Create SAVE20 for 20% off.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Off</th>
                  <th className="px-4 py-3 font-medium">Redeemed</th>
                  <th className="px-4 py-3 font-medium">Window</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => {
                  const max = Number(row.max_redemptions) || 0
                  const used = Number(row.redeemed_count) || 0
                  return (
                    <tr key={row.id} className="hover:bg-neutral-50/80">
                      <td className="px-4 py-3 font-semibold tracking-wide text-neutral-900">
                        {row.code}
                      </td>
                      <td className="px-4 py-3">{row.percent_off}%</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {used}
                        {max > 0 ? ` / ${max}` : ' / ∞'}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">
                        {row.valid_from || row.valid_until
                          ? `${dateInputValue(row.valid_from) || '…'} → ${dateInputValue(row.valid_until) || '…'}`
                          : 'Always'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            toggleMutation.mutate({ id: row.id, active: row.active === false })
                          }
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            row.active === false
                              ? 'bg-neutral-100 text-neutral-500'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {row.active === false ? 'Off' : 'Active'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="p-2 text-neutral-500 hover:text-primary inline-flex"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete coupon ${row.code}?`)) {
                              deleteMutation.mutate(row.id)
                            }
                          }}
                          className="p-2 text-neutral-500 hover:text-red-600 inline-flex"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editing ? 'Edit coupon' : 'New coupon'}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide"
                  placeholder="SAVE20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Percent off</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.percent_off}
                  onChange={(e) => setForm({ ...form, percent_off: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Max redemptions (0 = unlimited)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.max_redemptions}
                  onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Valid from</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Valid until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Internal only"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => {
                  setError('')
                  try {
                    toPayload(form)
                    saveMutation.mutate()
                  } catch (err: any) {
                    setError(err.message || 'Invalid form')
                  }
                }}
                className="btn-primary w-full py-2.5 disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
