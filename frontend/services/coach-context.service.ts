import { profileService } from './profile.service'
import { sessionPersonalizationService } from './session-personalization.service'
import { buildOnboardingContext, buildPersonalizationRules } from './ai.service'
import { pb } from '../lib/pocketbase'
import type { UserProfile } from '../types/models'

const MAX_CHARS = 3800

function clip(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

async function buildJournalSection(userId: string): Promise<string> {
  const lines = ['JOURNAL (recent — themes only, never quote verbatim):']
  try {
    const rows = await pb.collection('journal_entries').getList(1, 8, {
      filter: `user = "${userId}"`,
      sort: '-date',
    })
    if (!rows.items.length) {
      lines.push('- No journal entries yet.')
      return lines.join('\n')
    }
    for (const e of rows.items as any[]) {
      const mood = e.mood || ''
      const body = clip(String(e.content || ''), 160)
      const title = clip(String(e.title || ''), 60)
      if (!body && !title) continue
      lines.push(`- ${e.date || '?'}${mood ? ` [${mood}]` : ''}${title ? ` ${title}:` : ':'} ${body}`)
    }
  } catch {
    lines.push('- Journal unavailable.')
  }
  if (lines.length === 1) lines.push('- No readable journal text.')
  return lines.join('\n')
}

async function currentDay(userId: string): Promise<number> {
  try {
    const session = await pb.collection('user_sessions').getFirstListItem(`user = "${userId}"`)
    const d = Number((session as { current_day?: number }).current_day)
    if (d >= 1 && d <= 30) return d
  } catch {
    /* fall through */
  }
  try {
    // Fallback: highest program day from progress expand
    const rows = await pb.collection('session_progress').getList(1, 30, {
      filter: `user = "${userId}"`,
      expand: 'program_day',
      sort: '-id',
    })
    let max = 1
    for (const row of rows.items as any[]) {
      const n = Number(row.expand?.program_day?.day_number)
      if (n > max) max = n
    }
    return max <= 30 ? max : 1
  } catch {
    return 1
  }
}

/** Assemble KYC + journal + session response context for Coach turns. */
export async function buildCoachLearningContext(
  userId: string,
  profile?: UserProfile | null
): Promise<{ learningContext: string; dayNumber: number; archetype: string }> {
  let userProfile = profile
  if (!userProfile) {
    const res = await profileService.getByUserId(userId)
    userProfile = res.data || null
  }

  const dayNumber = await currentDay(userId)
  const sections: string[] = []

  if (userProfile) {
    sections.push('KYC / ONBOARDING')
    sections.push(buildOnboardingContext(userProfile))
    sections.push(buildPersonalizationRules(userProfile))
  } else {
    sections.push('KYC / ONBOARDING\n- Profile not loaded.')
  }

  sections.push(await buildJournalSection(userId))
  sections.push(await sessionPersonalizationService.buildStepResponseContext(userId, dayNumber))

  try {
    const bp = await pb.collection('user_behavior_profiles').getFirstListItem(`user = "${userId}"`).catch(() => null)
    if (bp && (bp as any).learning_phase === 'active') {
      sections.push(
        [
          'BEHAVIOR',
          `Dominant trigger: ${(bp as any).dominant_trigger || '?'}`,
          `Mood trend: ${(bp as any).mood_trend || '?'}`,
          `Intensity trend: ${(bp as any).intensity_trend || '?'}`,
        ].join('\n')
      )
    }
  } catch {
    /* ignore */
  }

  let learningContext = sections.join('\n\n')
  if (learningContext.length > MAX_CHARS) {
    learningContext = `${learningContext.slice(0, MAX_CHARS)}\n…[truncated]`
  }

  return {
    learningContext,
    dayNumber,
    archetype: String(userProfile?.quit_archetype || 'unknown'),
  }
}

/** Headers present check for runnable tests. */
export function coachContextHasSections(text: string): boolean {
  return (
    /KYC/i.test(text) &&
    /JOURNAL/i.test(text) &&
    (/USER INPUT HISTORY/i.test(text) || /SESSION/i.test(text) || /reflection/i.test(text))
  )
}
