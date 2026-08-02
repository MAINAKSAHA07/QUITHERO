import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers, pb } from '../../lib/pocketbase'
import { getUserLastActive } from '../../lib/userActivity'
import { fetchActivityByUser } from '../../lib/fetchActivityByUser'
import {
  SEGMENT_LABELS,
  normalizeCriteria,
  indexProfilesByUser,
  userMatchesCustomCriteria,
  userMatchesSegment,
  type CustomSegmentCriteria,
  type SegmentId,
  type StoredUserSegment,
} from '../../lib/userSegments'
import { Plus, TrendingUp, TrendingDown, Eye, Edit, Trash2, X, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sendAdminBulkEmail } from '../../lib/sendEmail'
import { segmentReminderPreset } from '../../lib/segmentEmailPresets'

type ActivityMode = 'any' | 'active' | 'inactive'

type FormState = {
  name: string
  description: string
  activityMode: ActivityMode
  activityDays: string
  registeredWithinDays: string
  useRegistered: boolean
  minSlips: string
  maxSlips: string
  minCompleted: string
  maxCompleted: string
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  activityMode: 'any',
  activityDays: '7',
  registeredWithinDays: '7',
  useRegistered: false,
  minSlips: '',
  maxSlips: '',
  minCompleted: '',
  maxCompleted: '',
})

function formToCriteria(f: FormState): CustomSegmentCriteria {
  const days = Number(f.activityDays) || 7
  return normalizeCriteria({
    activeWithinDays: f.activityMode === 'active' ? days : null,
    inactiveAtLeastDays: f.activityMode === 'inactive' ? days : null,
    registeredWithinDays: f.useRegistered ? Number(f.registeredWithinDays) || 7 : null,
    minSlips: f.minSlips === '' ? null : Number(f.minSlips),
    maxSlips: f.maxSlips === '' ? null : Number(f.maxSlips),
    minCompletedSessions: f.minCompleted === '' ? null : Number(f.minCompleted),
    maxCompletedSessions: f.maxCompleted === '' ? null : Number(f.maxCompleted),
  })
}

function criteriaToForm(c: CustomSegmentCriteria, name: string, description: string): FormState {
  const n = normalizeCriteria(c)
  let activityMode: ActivityMode = 'any'
  let activityDays = '7'
  if (n.activeWithinDays != null) {
    activityMode = 'active'
    activityDays = String(n.activeWithinDays)
  } else if (n.inactiveAtLeastDays != null) {
    activityMode = 'inactive'
    activityDays = String(n.inactiveAtLeastDays)
  }
  return {
    name,
    description: description || '',
    activityMode,
    activityDays,
    registeredWithinDays: String(n.registeredWithinDays ?? 7),
    useRegistered: n.registeredWithinDays != null,
    minSlips: n.minSlips == null ? '' : String(n.minSlips),
    maxSlips: n.maxSlips == null ? '' : String(n.maxSlips),
    minCompleted: n.minCompletedSessions == null ? '' : String(n.minCompletedSessions),
    maxCompleted: n.maxCompletedSessions == null ? '' : String(n.maxCompletedSessions),
  }
}

const predefinedSegments: {
  id: SegmentId
  name: string
  description: string
  isPredefined: true
}[] = [
  {
    id: 'active',
    name: SEGMENT_LABELS.active,
    description: 'Users with real activity in the last 7 days',
    isPredefined: true,
  },
  {
    id: 'inactive',
    name: SEGMENT_LABELS.inactive,
    description: 'No real app activity in the last 30 days (includes never-active)',
    isPredefined: true,
  },
  {
    id: 'high-risk',
    name: SEGMENT_LABELS['high-risk'],
    description: 'Users with many slips and low session completion',
    isPredefined: true,
  },
  {
    id: 'star-performers',
    name: SEGMENT_LABELS['star-performers'],
    description: 'Users who completed the program with no slips',
    isPredefined: true,
  },
  {
    id: 'new-users',
    name: SEGMENT_LABELS['new-users'],
    description: 'Users registered within the last 7 days',
    isPredefined: true,
  },
  {
    id: 'churned',
    name: SEGMENT_LABELS.churned,
    description: 'No real app activity in the last 90 days',
    isPredefined: true,
  },
  {
    id: 'kyc-completed',
    name: SEGMENT_LABELS['kyc-completed'],
    description: 'Users who finished onboarding / KYC',
    isPredefined: true,
  },
]

export const UserSegments = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [emailTarget, setEmailTarget] = useState<{
    key: string
    name: string
    emails: string[]
  } | null>(null)
  const [emailForm, setEmailForm] = useState({
    subject: '',
    title: '',
    text: '',
    preheader: '',
    ctaLabel: 'Open Smono',
    ctaUrl: 'https://app.smono.app',
  })
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)

  const { data: usersData } = useQuery({
    queryKey: ['users', 'all', 'email'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('users', {
        fields: 'id,email,name,created,updated',
      }),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
  })

  const { data: cravingsData } = useQuery({
    queryKey: ['cravings', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('cravings'),
  })

  const { data: profilesData } = useQuery({
    queryKey: ['user_profiles', 'segment-filter'],
    queryFn: () =>
      adminCollectionHelpers.getFullList('user_profiles', {
        fields:
          'id,user,onboarding_completed_at,quit_archetype,quit_date,smoking_triggers,emotional_states,daily_consumption',
      }),
  })

  const { data: activityByUser = new Map<string, number>() } = useQuery({
    queryKey: ['activity-by-user'],
    queryFn: fetchActivityByUser,
    staleTime: 60_000,
  })

  const { data: customData, isLoading: customLoading } = useQuery({
    queryKey: ['user_segments'],
    queryFn: () => adminCollectionHelpers.getFullList('user_segments', { sort: '-created' }),
  })

  const customSegments: StoredUserSegment[] = useMemo(() => {
    const rows = (customData?.data || []) as any[]
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      criteria: normalizeCriteria(r.criteria),
      created_by: r.created_by,
      created: r.created,
      updated: r.updated,
    }))
  }, [customData?.data])

  const profilesByUser = useMemo(
    () => indexProfilesByUser((profilesData?.data || []) as any[]),
    [profilesData?.data]
  )

  const segmentContext = {
    activityByUser,
    sessions: (sessionsData?.data || []) as { user?: string; status?: string }[],
    cravings: (cravingsData?.data || []) as { user?: string; type?: string }[],
    profilesByUser,
  }

  const countPredefined = (segmentId: SegmentId) => {
    if (!usersData?.data) return 0
    return usersData.data.filter((u: any) => userMatchesSegment(u, segmentId, segmentContext)).length
  }

  const countCustom = (criteria: CustomSegmentCriteria) => {
    if (!usersData?.data) return 0
    return usersData.data.filter((u: any) => userMatchesCustomCriteria(u, criteria, segmentContext))
      .length
  }

  const calculateTrend = (segmentId: SegmentId): number => {
    const currentCount = countPredefined(segmentId)
    if (!['active', 'inactive', 'new-users', 'churned'].includes(segmentId)) return 0
    const periodDays =
      segmentId === 'active' ? 7 : segmentId === 'inactive' ? 30 : segmentId === 'new-users' ? 7 : 90
    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays * 2)
    const previousPeriodEnd = new Date()
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodDays)

    let previousCount = 0
    if (segmentId === 'active' || segmentId === 'inactive') {
      previousCount =
        usersData?.data?.filter((u: any) => {
          const last = getUserLastActive(u, activityByUser.get(u.id))
          if (!last) return segmentId === 'inactive'
          if (segmentId === 'active') return last > previousPeriodEnd && last <= previousPeriodStart
          return last < previousPeriodEnd && last >= previousPeriodStart
        }).length || 0
    } else if (segmentId === 'new-users') {
      previousCount =
        usersData?.data?.filter((u: any) => {
          if (!u.created) return false
          const created = new Date(u.created)
          return created > previousPeriodStart && created <= previousPeriodEnd
        }).length || 0
    } else if (segmentId === 'churned') {
      previousCount =
        usersData?.data?.filter((u: any) => {
          const last = getUserLastActive(u, activityByUser.get(u.id))
          if (!last) return true
          return last < previousPeriodEnd && last >= previousPeriodStart
        }).length || 0
    }

    if (previousCount === 0) return currentCount > 0 ? 100 : 0
    return Math.round(((currentCount - previousCount) / previousCount) * 100)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (seg: StoredUserSegment) => {
    setEditingId(seg.id)
    setForm(criteriaToForm(seg.criteria, seg.name, seg.description || ''))
    setFormError(null)
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim()
      if (!name) throw new Error('Name is required')
      const criteria = formToCriteria(form)
      const hasRule =
        criteria.activeWithinDays != null ||
        criteria.inactiveAtLeastDays != null ||
        criteria.registeredWithinDays != null ||
        criteria.minSlips != null ||
        criteria.maxSlips != null ||
        criteria.minCompletedSessions != null ||
        criteria.maxCompletedSessions != null
      if (!hasRule) throw new Error('Add at least one filter rule')

      const payload = {
        name,
        description: form.description.trim(),
        criteria,
        created_by: pb.authStore.record?.id || '',
      }

      if (editingId) {
        const res = await adminCollectionHelpers.update('user_segments', editingId, payload)
        if (!res.success) throw new Error(res.error || 'Update failed')
        return res
      }
      const res = await adminCollectionHelpers.create('user_segments', payload)
      if (!res.success) throw new Error(res.error || 'Create failed')
      return res
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user_segments'] })
      setModalOpen(false)
      setEditingId(null)
      setForm(emptyForm())
    },
    onError: (e: Error) => setFormError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminCollectionHelpers.delete('user_segments', id)
      if (!res.success) throw new Error(res.error || 'Delete failed')
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['user_segments'] }),
    onError: (e: Error) => window.alert(e.message),
  })

  const previewCount = useMemo(() => countCustom(formToCriteria(form)), [
    form,
    usersData?.data,
    sessionsData?.data,
    cravingsData?.data,
    activityByUser,
  ])

  const handleViewUsers = (segmentKey: string) => {
    navigate({ pathname: '/users', search: `?segment=${encodeURIComponent(segmentKey)}` })
  }

  const emailsForUsers = (users: { email?: string }[]) =>
    [
      ...new Set(
        users
          .map((u) => String(u.email || '').trim().toLowerCase())
          .filter((e) => e.includes('@'))
      ),
    ]

  const openEmailSegment = (key: string, name: string, users: { email?: string }[]) => {
    if (!users.length) {
      window.alert(
        `No users match “${name}” right now. Open View Users to confirm the filter.`
      )
      return
    }
    const emails = emailsForUsers(users)
    if (!emails.length) {
      window.alert(
        `${users.length} user(s) match “${name}”, but none have an email on file.`
      )
      return
    }
    const preset = segmentReminderPreset(key, name)
    setEmailTarget({ key, name, emails })
    setEmailForm({
      subject: preset.subject,
      title: preset.title,
      text: preset.text,
      preheader: preset.preheader,
      ctaLabel: preset.ctaLabel,
      ctaUrl: preset.ctaUrl,
    })
    setEmailMsg(null)
  }

  const sendSegmentEmail = async () => {
    if (!emailTarget) return
    if (!emailForm.subject.trim() || !emailForm.text.trim()) {
      setEmailMsg('Subject and message are required.')
      return
    }
    if (
      !window.confirm(
        `Email ${emailTarget.emails.length} users in “${emailTarget.name}”?`
      )
    ) {
      return
    }
    setEmailBusy(true)
    setEmailMsg(null)
    try {
      const result = await sendAdminBulkEmail({
        emails: emailTarget.emails,
        subject: emailForm.subject.trim(),
        text: emailForm.text.trim(),
        title: emailForm.title.trim() || emailForm.subject.trim(),
        preheader: emailForm.preheader.trim() || undefined,
        ctaLabel: emailForm.ctaLabel.trim() || undefined,
        ctaUrl: emailForm.ctaUrl.trim() || undefined,
      })
      if (!result.ok && !result.sent) {
        setEmailMsg(result.error || 'Send failed')
        return
      }
      const failHint =
        result.failures && result.failures.length
          ? ` — e.g. ${result.failures[0].to}: ${result.failures[0].error}`
          : ''
      setEmailMsg(
        `Sent ${result.sent ?? 0}` +
          (result.failed ? `, failed ${result.failed}${failHint}` : '') +
          (result.ok
            ? ''
            : ' (check spam on other inboxes; Gmail free SMTP often delays/drops bulk)')
      )
    } catch (err: any) {
      setEmailMsg(err?.message || 'Send failed')
    } finally {
      setEmailBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">User Segments</h1>
          <p className="text-neutral-500 mt-1">Create and manage user cohorts for targeted actions</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Custom Segment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predefinedSegments.map((segment) => {
          const trend = calculateTrend(segment.id)
          const userCount = countPredefined(segment.id)
          return (
            <div key={segment.id} className="bg-white rounded-lg shadow-card p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-dark mb-1">{segment.name}</h3>
                <p className="text-sm text-neutral-500">{segment.description}</p>
                <span className="inline-block mt-2 text-[10px] uppercase tracking-wide font-semibold text-neutral-400">
                  Built-in
                </span>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-neutral-dark">{userCount}</span>
                  <span className="text-sm text-neutral-500">users</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-neutral-500'
                  }`}
                >
                  {trend > 0 ? <TrendingUp className="w-4 h-4" /> : null}
                  {trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                  <span>
                    {trend > 0 ? '+' : ''}
                    {trend}% vs last period
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleViewUsers(segment.id)}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View Users
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const users = (
                      usersData?.data?.filter((u: any) =>
                        userMatchesSegment(u, segment.id, segmentContext)
                      ) || []
                    ) as { email?: string }[]
                    openEmailSegment(segment.id, segment.name, users)
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/5"
                >
                  <Mail className="w-4 h-4" />
                  Email reminder
                </button>
              </div>
            </div>
          )
        })}

        {customLoading ? (
          <div className="bg-white rounded-lg shadow-card p-6 text-sm text-neutral-400">Loading custom…</div>
        ) : null}

        {customSegments.map((segment) => (
          <div key={segment.id} className="bg-white rounded-lg shadow-card p-6 border border-primary/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-neutral-dark mb-1 truncate">{segment.name}</h3>
                <p className="text-sm text-neutral-500">{segment.description || 'Custom cohort'}</p>
                <span className="inline-block mt-2 text-[10px] uppercase tracking-wide font-semibold text-primary">
                  Custom
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className="p-1 hover:bg-neutral-100 rounded"
                  onClick={() => openEdit(segment)}
                  aria-label="Edit"
                >
                  <Edit className="w-4 h-4 text-primary" />
                </button>
                <button
                  type="button"
                  className="p-1 hover:bg-neutral-100 rounded"
                  onClick={() => {
                    if (window.confirm(`Delete segment “${segment.name}”?`)) {
                      deleteMutation.mutate(segment.id)
                    }
                  }}
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4 text-danger" />
                </button>
              </div>
            </div>
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-neutral-dark">{countCustom(segment.criteria)}</span>
              <span className="text-sm text-neutral-500">users</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleViewUsers(segment.id)}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Eye className="w-4 h-4" />
                View Users
              </button>
              <button
                type="button"
                onClick={() => {
                  const users = (
                    usersData?.data?.filter((u: any) =>
                      userMatchesCustomCriteria(u, segment.criteria, segmentContext)
                    ) || []
                  ) as { email?: string }[]
                  openEmailSegment(segment.id, segment.name, users)
                }}
                className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/5"
              >
                <Mail className="w-4 h-4" />
                Email reminder
              </button>
            </div>
          </div>
        ))}
      </div>

      {emailTarget && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !emailBusy && setEmailTarget(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-dark">Email segment</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {emailTarget.name} · {emailTarget.emails.length} recipients
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmailTarget(null)}
                className="text-neutral-500 hover:text-neutral-700"
                disabled={emailBusy}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Subject</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  value={emailForm.title}
                  onChange={(e) => setEmailForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                <textarea
                  rows={5}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  value={emailForm.text}
                  onChange={(e) => setEmailForm((f) => ({ ...f, text: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">CTA label</label>
                  <input
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                    value={emailForm.ctaLabel}
                    onChange={(e) => setEmailForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">CTA URL</label>
                  <input
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                    value={emailForm.ctaUrl}
                    onChange={(e) => setEmailForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                  />
                </div>
              </div>
              {emailMsg ? (
                <p className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                  {emailMsg}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="btn-secondary"
                disabled={emailBusy}
                onClick={() => setEmailTarget(null)}
              >
                {emailMsg ? 'Done' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={emailBusy}
                onClick={() => void sendSegmentEmail()}
              >
                <Mail className="w-4 h-4" />
                {emailBusy ? 'Sending…' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !saveMutation.isPending && setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Custom Segment' : 'Create Custom Segment'}
              </h2>
              <button
                type="button"
                className="p-1 rounded hover:bg-neutral-100"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Quiet 14+ days"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <input
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Activity</label>
                <select
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm mb-2"
                  value={form.activityMode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, activityMode: e.target.value as ActivityMode }))
                  }
                >
                  <option value="any">Any</option>
                  <option value="active">Active within last N days</option>
                  <option value="inactive">Inactive for N+ days</option>
                </select>
                {form.activityMode !== 'any' ? (
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                    value={form.activityDays}
                    onChange={(e) => setForm((f) => ({ ...f, activityDays: e.target.value }))}
                  />
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.useRegistered}
                  onChange={(e) => setForm((f) => ({ ...f, useRegistered: e.target.checked }))}
                />
                Registered within last N days
              </label>
              {form.useRegistered ? (
                <input
                  type="number"
                  min={1}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  value={form.registeredWithinDays}
                  onChange={(e) => setForm((f) => ({ ...f, registeredWithinDays: e.target.value }))}
                />
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Min slips</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                    value={form.minSlips}
                    onChange={(e) => setForm((f) => ({ ...f, minSlips: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Max slips</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                    value={form.maxSlips}
                    onChange={(e) => setForm((f) => ({ ...f, maxSlips: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Min completed sessions
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                    value={form.minCompleted}
                    onChange={(e) => setForm((f) => ({ ...f, minCompleted: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Max completed sessions
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                    value={form.maxCompleted}
                    onChange={(e) => setForm((f) => ({ ...f, maxCompleted: e.target.value }))}
                    placeholder="Any"
                  />
                </div>
              </div>

              <p className="text-sm text-neutral-500">
                Live match: <span className="font-semibold text-neutral-dark">{previewCount}</span> users
              </p>

              {formError ? <p className="text-sm text-danger">{formError}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary"
                disabled={saveMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={saveMutation.isPending}
                onClick={() => {
                  setFormError(null)
                  saveMutation.mutate()
                }}
              >
                {saveMutation.isPending ? 'Saving…' : editingId ? 'Update Segment' : 'Save Segment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
