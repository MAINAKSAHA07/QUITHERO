import {
  daysSinceLastActive,
  isUserActiveWithinDays,
} from './userActivity'

export const SEGMENT_IDS = [
  'active',
  'inactive',
  'high-risk',
  'star-performers',
  'new-users',
  'churned',
] as const

export type SegmentId = (typeof SEGMENT_IDS)[number]

export const SEGMENT_LABELS: Record<SegmentId, string> = {
  active: 'Active Users',
  inactive: 'Inactive Users',
  'high-risk': 'High Risk',
  'star-performers': 'Star Performers',
  'new-users': 'New Users',
  churned: 'Churned',
}

/** Segments that need the activity map before membership is meaningful. */
export function segmentNeedsActivity(segmentId: SegmentId): boolean {
  return segmentId === 'active' || segmentId === 'inactive' || segmentId === 'churned'
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
  now?: Date
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

    case 'inactive': {
      // Had real activity before, now quiet 30+ days (excludes never-activated)
      const daysSince = daysSinceLastActive(user, activity)
      return daysSince !== null && daysSince >= 30
    }

    case 'churned': {
      const daysSince = daysSinceLastActive(user, activity)
      return daysSince !== null && daysSince >= 90
    }

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

    default:
      return false
  }
}
