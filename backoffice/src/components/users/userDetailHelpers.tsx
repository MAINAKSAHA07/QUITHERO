import { formatDistanceToNow } from 'date-fns'

export function fmt(value: unknown): string {
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return String(value)
}

export function recordTypeColor(type: string): string {
  switch (type) {
    case 'personalization': return 'bg-blue-50 text-blue-700'
    case 'trigger_check': return 'bg-orange-50 text-orange-700'
    case 'comprehension_check': return 'bg-purple-50 text-purple-700'
    case 'comprehension_reread': return 'bg-amber-50 text-amber-700'
    default: return 'bg-neutral-100 text-neutral-600'
  }
}

export function JsonBlock({ data }: { data: unknown }) {
  if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
    return <p className="text-neutral-400 text-sm">No data</p>
  }
  return (
    <pre className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export function TimeAgo({ date }: { date?: string }) {
  if (!date) return <>—</>
  try {
    return <>{formatDistanceToNow(new Date(date), { addSuffix: true })}</>
  } catch {
    return <>{date}</>
  }
}

export type RecentActivityIcon = 'session' | 'craving' | 'journal' | 'achievement'

export type RecentActivityEvent = {
  id: string
  icon: RecentActivityIcon
  message: string
  date: string
}

/** Merge user records into a single timeline sorted newest-first. */
export function buildRecentActivityEvents(input: {
  sessions: any[]
  sessionProgress: any[]
  cravings: any[]
  journalEntries: any[]
  achievements: any[]
}): RecentActivityEvent[] {
  const events: RecentActivityEvent[] = []

  const sessions = [...input.sessions].sort(
    (a, b) =>
      new Date(b.updated || b.created || 0).getTime() -
      new Date(a.updated || a.created || 0).getTime()
  )
  const session = sessions[0]
  const hasProgress = input.sessionProgress.some((sp) => sp.status && sp.status !== 'not_started')
  const programStarted =
    hasProgress ||
    sessions.some((s) => s.started_at || (s.status && s.status !== 'not_started'))
  const startedAt = session?.started_at || (programStarted ? session?.created : null)
  if (startedAt && programStarted) {
    events.push({
      id: `session-start-${session?.id || startedAt}`,
      icon: 'session',
      message: 'Started 1st session',
      date: startedAt,
    })
  }

  for (const sp of input.sessionProgress) {
    if (sp.status !== 'completed' || !sp.completed_at) continue
    const dayNum = sp.expand?.program_day?.day_number
    events.push({
      id: `sp-${sp.id}`,
      icon: 'session',
      message: dayNum != null ? `Completed Day ${dayNum}` : 'Completed session',
      date: sp.completed_at,
    })
  }

  for (const craving of input.cravings) {
    if (!craving.created) continue
    const label =
      craving.type === 'slip'
        ? `Logged slip${craving.trigger ? ` — ${craving.trigger}` : ''}`
        : `Logged craving${craving.trigger ? ` — ${craving.trigger}` : ''}`
    events.push({
      id: `craving-${craving.id}`,
      icon: 'craving',
      message: label,
      date: craving.created,
    })
  }

  for (const entry of input.journalEntries) {
    const when = entry.date || entry.created
    if (!when) continue
    events.push({
      id: `journal-${entry.id}`,
      icon: 'journal',
      message: 'Created journal entry',
      date: when,
    })
  }

  for (const ua of input.achievements) {
    const when = ua.unlocked_at || ua.created
    if (!when) continue
    const title = ua.expand?.achievement?.title
    events.push({
      id: `achievement-${ua.id}`,
      icon: 'achievement',
      message: title ? `Unlocked "${title}"` : 'Unlocked achievement',
      date: when,
    })
  }

  return events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
}

export const KYC_FIELDS: { key: string; label: string }[] = [
  { key: 'onboarding_name', label: 'Preferred name' },
  { key: 'phone', label: 'Phone' },
  { key: 'primary_trigger', label: 'Primary trigger' },
  { key: 'craving_peak_time', label: 'Craving peak time' },
  { key: 'daily_stress_level', label: 'Daily stress level' },
  { key: 'first_use_after_waking', label: 'First use after waking' },
  { key: 'smoking_times', label: 'Smoking times' },
  { key: 'smoking_environments', label: 'Smoking environments' },
  { key: 'pack_cost', label: 'Pack cost' },
  { key: 'minutes_per_cigarette', label: 'Minutes per cigarette' },
  { key: 'started_age_range', label: 'Started age range' },
  { key: 'tried_quitting_before', label: 'Tried quitting before' },
  { key: 'quit_attempt_count', label: 'Quit attempt count' },
  { key: 'previous_attempt_difficulty', label: 'Previous attempt difficulty' },
  { key: 'past_quit_tools', label: 'Past quit tools' },
  { key: 'primary_motivation', label: 'Primary motivation' },
  { key: 'priority_goal', label: 'Priority goal' },
  { key: 'quit_goal_style', label: 'Quit goal style' },
  { key: 'quit_confidence', label: 'Quit confidence' },
  { key: 'cravings_worry', label: 'Cravings worry' },
  { key: 'relapse_worry', label: 'Relapse worry' },
  { key: 'withdrawal_worry', label: 'Withdrawal worry' },
  { key: 'household_smokers', label: 'Household smokers' },
  { key: 'occupation_style', label: 'Occupation style' },
  { key: 'reminder_frequency', label: 'Reminder frequency' },
  { key: 'support_preference', label: 'Support preference' },
  { key: 'checkin_time_preference', label: 'Check-in time preference' },
  { key: 'success_outcome', label: 'Success outcome' },
  { key: 'commitment_statement', label: 'Commitment statement' },
  { key: 'readiness_score', label: 'Readiness score' },
  { key: 'relapse_risk_score', label: 'Relapse risk score' },
  { key: 'support_intensity_score', label: 'Support intensity score' },
  { key: 'secondary_quit_archetype', label: 'Secondary archetype' },
  { key: 'onboarding_completed_at', label: 'Onboarding completed' },
  { key: 'subscription_status', label: 'Subscription status' },
]
