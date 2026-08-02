import {
  isUserActiveWithinDays,
} from './userActivity'

export const SEGMENT_IDS = [
  'active',
  'inactive',
  'high-risk',
  'star-performers',
  'new-users',
  'churned',
  'kyc-completed',
] as const

export type SegmentId = (typeof SEGMENT_IDS)[number]

export const SEGMENT_LABELS: Record<SegmentId, string> = {
  active: 'Active Users',
  inactive: 'Inactive Users',
  'high-risk': 'High Risk',
  'star-performers': 'Star Performers',
  'new-users': 'New Users',
  churned: 'Churned',
  'kyc-completed': 'KYC Completed',
}

/** Saved custom cohort criteria (JSON on user_segments.criteria). */
export type CustomSegmentCriteria = {
  /** Must have activity within this many days */
  activeWithinDays?: number | null
  /** Days since last activity must be >= this (and have had activity) */
  inactiveAtLeastDays?: number | null
  /** Account created within this many days */
  registeredWithinDays?: number | null
  minSlips?: number | null
  maxSlips?: number | null
  minCompletedSessions?: number | null
  maxCompletedSessions?: number | null
}

export type StoredUserSegment = {
  id: string
  name: string
  description?: string
  criteria: CustomSegmentCriteria
  created_by?: string
  created?: string
  updated?: string
}

/** Segments that need the activity map before membership is meaningful. */
export function segmentNeedsActivity(segmentId: string): boolean {
  if (segmentId === 'active' || segmentId === 'inactive' || segmentId === 'churned') return true
  return false
}

export function segmentNeedsProfiles(segmentId: string): boolean {
  return segmentId === 'kyc-completed'
}

/** Same signals as app `isKycComplete` — keep in sync. */
export type SegmentProfile = {
  user?: string
  onboarding_completed_at?: string | null
  quit_archetype?: string | null
  quit_date?: string | null
  smoking_triggers?: unknown
  emotional_states?: unknown
  daily_consumption?: number | null
}

export function profileIsKycComplete(p: SegmentProfile | null | undefined): boolean {
  if (!p) return false
  if (p.onboarding_completed_at) return true
  if (p.quit_archetype && p.quit_date) return true
  if (
    p.quit_date &&
    ((Array.isArray(p.smoking_triggers) && p.smoking_triggers.length > 0) ||
      (Array.isArray(p.emotional_states) && p.emotional_states.length > 0) ||
      (typeof p.daily_consumption === 'number' && p.daily_consumption > 0))
  ) {
    return true
  }
  return false
}

export function indexProfilesByUser(profiles: SegmentProfile[]): Map<string, SegmentProfile> {
  const m = new Map<string, SegmentProfile>()
  for (const p of profiles) {
    if (p.user) m.set(String(p.user), p)
  }
  return m
}

export function customCriteriaNeedsActivity(c: CustomSegmentCriteria): boolean {
  return c.activeWithinDays != null || c.inactiveAtLeastDays != null
}

export function customCriteriaNeedsEngagement(c: CustomSegmentCriteria): boolean {
  return (
    c.minSlips != null ||
    c.maxSlips != null ||
    c.minCompletedSessions != null ||
    c.maxCompletedSessions != null
  )
}

export function isSegmentId(value: string | null | undefined): value is SegmentId {
  return Boolean(value && (SEGMENT_IDS as readonly string[]).includes(value))
}

type SegmentUser = {
  id: string
  created?: string
  lastActive?: string
  [key: string]: unknown
}

type SegmentContext = {
  activityByUser: Map<string, number>
  sessions?: { user?: string; status?: string }[]
  cravings?: { user?: string; type?: string }[]
  profilesByUser?: Map<string, SegmentProfile>
  now?: Date
}

function numOrNull(v: unknown): number | null {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function normalizeCriteria(raw: unknown): CustomSegmentCriteria {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    activeWithinDays: numOrNull(o.activeWithinDays),
    inactiveAtLeastDays: numOrNull(o.inactiveAtLeastDays),
    registeredWithinDays: numOrNull(o.registeredWithinDays),
    minSlips: numOrNull(o.minSlips),
    maxSlips: numOrNull(o.maxSlips),
    minCompletedSessions: numOrNull(o.minCompletedSessions),
    maxCompletedSessions: numOrNull(o.maxCompletedSessions),
  }
}

export function userMatchesCustomCriteria(
  user: SegmentUser,
  criteria: CustomSegmentCriteria,
  ctx: SegmentContext
): boolean {
  const now = ctx.now || new Date()
  const activity = ctx.activityByUser
  const sessions = ctx.sessions || []
  const cravings = ctx.cravings || []
  const c = normalizeCriteria(criteria)

  if (c.activeWithinDays != null && c.activeWithinDays > 0) {
    if (!isUserActiveWithinDays(user, activity, c.activeWithinDays)) return false
  }

  if (c.inactiveAtLeastDays != null && c.inactiveAtLeastDays > 0) {
    // Includes never-active — same as predefined inactive
    if (isUserActiveWithinDays(user, activity, c.inactiveAtLeastDays)) return false
  }

  if (c.registeredWithinDays != null && c.registeredWithinDays > 0) {
    if (!user.created) return false
    const cutoff = new Date(now.getTime() - c.registeredWithinDays * 24 * 60 * 60 * 1000)
    if (new Date(user.created) <= cutoff) return false
  }

  const userCravings = cravings.filter((x) => x.user === user.id)
  const slips = userCravings.filter((x) => x.type === 'slip').length
  if (c.minSlips != null && slips < c.minSlips) return false
  if (c.maxSlips != null && slips > c.maxSlips) return false

  const userSessions = sessions.filter((x) => x.user === user.id)
  const completed = userSessions.filter((x) => x.status === 'completed').length
  if (c.minCompletedSessions != null && completed < c.minCompletedSessions) return false
  if (c.maxCompletedSessions != null && completed > c.maxCompletedSessions) return false

  return true
}

export function userMatchesSegment(
  user: SegmentUser,
  segmentId: SegmentId,
  ctx: SegmentContext
): boolean {
  const now = ctx.now || new Date()
  const activity = ctx.activityByUser
  const sessions = ctx.sessions || []
  const cravings = ctx.cravings || []

  switch (segmentId) {
    case 'active':
      return isUserActiveWithinDays(user, activity, 7)

    case 'inactive':
      // Same idea as All Users status=inactive, 30d window: never-active + quiet 30d+
      return !isUserActiveWithinDays(user, activity, 30)

    case 'churned':
      return !isUserActiveWithinDays(user, activity, 90)

    case 'new-users': {
      if (!user.created) return false
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return new Date(user.created) > cutoff
    }

    case 'high-risk': {
      const userSessions = sessions.filter((s) => s.user === user.id)
      const userCravings = cravings.filter((c) => c.user === user.id)
      const slips = userCravings.filter((c) => c.type === 'slip').length
      const completed = userSessions.filter((s) => s.status === 'completed').length
      return slips > 3 && completed < 5
    }

    case 'star-performers': {
      const userSessions = sessions.filter((s) => s.user === user.id)
      const userCravings = cravings.filter((c) => c.user === user.id)
      const completed = userSessions.filter((s) => s.status === 'completed').length
      const slips = userCravings.filter((c) => c.type === 'slip').length
      return completed >= 10 && slips === 0
    }

    case 'kyc-completed':
      return profileIsKycComplete(ctx.profilesByUser?.get(user.id))

    default:
      return false
  }
}

/** Resolve URL ?segment= for predefined or custom PB id. */
export function resolveSegmentFilter(
  param: string | null,
  customById: Map<string, StoredUserSegment>
):
  | { kind: 'predefined'; id: SegmentId }
  | { kind: 'custom'; segment: StoredUserSegment }
  | null {
  if (!param) return null
  if (isSegmentId(param)) return { kind: 'predefined', id: param }
  const custom = customById.get(param)
  if (custom) return { kind: 'custom', segment: custom }
  return null
}
