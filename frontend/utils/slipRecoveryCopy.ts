import type { UserProfile } from '../types/models'

/** First name from KYC / profile for slip recovery tone. */
export function slipRecoveryName(profile: UserProfile | null | undefined): string {
  const raw = (profile?.onboarding_name || '').trim()
  if (!raw) return ''
  return raw.split(/\s+/)[0] || ''
}

function pickOne<T>(items: T[], rng: () => number): T {
  if (items.length === 0) throw new Error('pickOne: empty')
  return items[Math.floor(rng() * items.length) % items.length]!
}

/** Universal lines — always in the pool so KYC never maps 1:1 to a fixed sentence. */
const GENERAL_LINES = [
  'You are stronger than this craving. No worries — a slip does not erase your progress.',
  'One slip is a moment, not a verdict. You can still change what happens next.',
  'Logging it took guts. That awareness is already you taking the wheel again.',
  'Most people who quit for good slipped along the way. You are still in the fight.',
  'Be kind to yourself here. Reset starts with the next choice, not a perfect past.',
  'This does not undo the work you have already done. Keep going.',
  'Cravings lie. You noticed, you owned it — that is strength, not failure.',
  'No scoreboard needed. What matters is the next hour, and you get to choose it.',
]

const PRIMARY_POOL: Record<string, string[]> = {
  'Physical health / breathing quality': [
    'Your health still matters more than this one moment.',
    'Breathing easier was the point — that goal is still yours.',
    'Your body can bounce back. One slip does not lock the door.',
  ],
  'Family & loved ones': [
    'The people you care about still need the stronger you.',
    'Love was a reason you started — it is still a reason to continue.',
    'You are allowed to stumble and still show up for them.',
  ],
  'Financial savings': [
    'Your money goals are still within reach.',
    'One slip is a small cost next to the savings you are building.',
    'You can still keep more of what you earn — starting now.',
  ],
  'Self-confidence / freedom': [
    'Freedom is still yours. One cigarette does not own you.',
    'Confidence grows from returning, not from never falling.',
    'You chose yourself once. You can choose yourself again.',
  ],
  'Social / hygiene': [
    'The freer version of you is still available.',
    'You can still feel clean and clear again — next choice counts.',
    'Social ease was the aim. A slip does not cancel that path.',
  ],
}

const MOTIVATION_POOL: Record<string, string[]> = {
  'Improve my health': [
    'Your health goal is still intact.',
    'Healing is not linear — keep showing up for it.',
  ],
  'Feel more energetic': [
    'Energy comes back with consistency, not perfection.',
    'You can still feel lighter again from this next stretch.',
  ],
  'For my family': [
    'Your family reason still stands.',
    'They benefit from you trying again, not from a flawless streak.',
  ],
  'Save money': [
    'Your savings goal is still worth fighting for.',
    'Money you keep tomorrow still counts.',
  ],
  'Mental peace': [
    'Peace is built in small returns — this can be one.',
    'You can still choose calm over guilt right now.',
  ],
  'Feel in control again': [
    'Logging this slip is already a control move.',
    'Control returns with the next decision, not the last one.',
  ],
  'Feel better about myself': [
    'You still get to become someone you feel proud of.',
    'Self-respect grows when you restart without shame.',
  ],
  'Improve appearance': [
    'The version of you you want is still ahead.',
    'Appearance goals survive a slip — consistency brings them back.',
  ],
  'More time in the day': [
    'Time you reclaim from nicotine still adds up.',
    'You can still buy back hours — starting with this next urge.',
  ],
  'Prepare for a new chapter in life': [
    'The chapter you wanted is still open.',
    'A slip is a page, not the ending.',
  ],
}

/** Build a shuffled-feeling pool from KYC themes + general lines (never a single fixed map). */
export function slipMotivationPool(profile: UserProfile | null | undefined): string[] {
  const pool = new Set<string>(GENERAL_LINES)

  const primary = (profile?.primary_motivation || '').trim()
  for (const line of PRIMARY_POOL[primary] || []) pool.add(line)

  const motivations = Array.isArray(profile?.motivations) ? profile!.motivations! : []
  for (const m of motivations) {
    for (const line of MOTIVATION_POOL[(m || '').trim()] || []) pool.add(line)
  }

  return [...pool]
}

/**
 * Random encouragement line. KYC widens the pool; it does not pick a predictable sentence.
 * Pass `rng` in checks for determinism.
 */
export function slipMotivationLine(
  profile: UserProfile | null | undefined,
  rng: () => number = Math.random
): string {
  return pickOne(slipMotivationPool(profile), rng)
}

const HEADLINES_WITH_DAYS = [
  (who: string, days: number, unit: string) =>
    `${who}ou're stronger than this — ${days} ${unit} of progress still counts`,
  (who: string, days: number, unit: string) =>
    `${who}ou've already built ${days} ${unit} — this slip does not erase that`,
  (who: string, _days: number, _unit: string) =>
    `${who}ou're stronger than this craving`,
  (who: string, days: number, unit: string) =>
    `${who}ou can still turn this around — ${days} ${unit} still belong to you`,
]

const HEADLINES_NO_DAYS = [
  (who: string) => `${who}ou're stronger than this`,
  (who: string) => `${who}ou can still change what happens next`,
  (who: string) => `${who}ou noticed it — that already takes strength`,
  (who: string) => `${who}ou're not starting from zero`,
]

export function slipRecoveryHeadline(
  name: string,
  daysFree: number,
  rng: () => number = Math.random
): string {
  const who = name ? `${name}, y` : 'Y'
  if (daysFree > 0) {
    const unit = daysFree === 1 ? 'day' : 'days'
    return pickOne(HEADLINES_WITH_DAYS, rng)(who, daysFree, unit)
  }
  return pickOne(HEADLINES_NO_DAYS, rng)(who)
}
