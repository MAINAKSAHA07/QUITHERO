import { StepType } from '../types/enums'
import { Step, UserProfile, ProgressStats, ExerciseStepContent, TriggerCheckContent, ComprehensionCheckContent } from '../types/models'
import {
  calculateYearlySpend,
  calculateCigarettesAvoidedYear,
  calculateMonthlySpend,
} from './onboardingCalculations'
import { formatMoney } from './currency'

const INJECTED_STEP_PREFIX = 'injected-'

/** Days that show a personalized stat card at session start */
export const STAT_CARD_DAYS = [1, 5, 10, 15, 20, 30] as const

/** Program days where trigger-matched users get a bonus exercise */
const TRIGGER_BRANCH_DAYS: Record<string, number[]> = {
  'Stress & anxiety': [4, 17, 27],
  'Boredom / driving': [5, 18],
  'Social pressure': [14],
  'Finishing meals': [13, 28],
  'Coffee / alcohol pairings': [13, 28],
}

const TRIGGER_EXERCISES: Record<string, { title: string; instructions: string; duration_seconds: number }> = {
  'Stress & anxiety': {
    title: 'Grounding breath for stress',
    instructions:
      'Your primary trigger is stress. Before today\'s lesson, take 60 seconds:\n\n1. Place both feet flat on the floor.\n2. Inhale for 4 counts, hold for 4, exhale for 6.\n3. Name one thing you can see and one you can hear.\n\nThis is the tool to reach for when stress hits — not a cigarette.',
    duration_seconds: 60,
  },
  'Boredom / driving': {
    title: 'Urge surfing for boredom',
    instructions:
      'Boredom is your main trigger. Try this 90-second reset:\n\n1. Notice the restless feeling without judging it.\n2. Breathe slowly — the urge will rise, peak, and fall like a wave.\n3. Ask: "What would I do if I weren\'t reaching for nicotine right now?"\n\nYou don\'t have to fill every empty moment with smoke.',
    duration_seconds: 90,
  },
  'Social pressure': {
    title: 'Social boundary rehearsal',
    instructions:
      'Social situations trigger you most. Practice this script silently:\n\n"I\'m good, thanks — I\'m not smoking anymore."\n\nSay it once out loud. Pause. Notice how it feels.\n\nYou don\'t owe anyone an explanation. A simple no is enough.',
    duration_seconds: 60,
  },
  'Finishing meals': {
    title: 'Meal-time pattern interrupt',
    instructions:
      'Meals are a strong cue for you. After eating, try this instead of reaching for nicotine:\n\n1. Stand up and walk to another room.\n2. Drink a full glass of water slowly.\n3. Take 5 deep breaths before deciding anything.\n\nBreak the automatic link between "finished eating" and "time to smoke."',
    duration_seconds: 45,
  },
  'Coffee / alcohol pairings': {
    title: 'Pairing interrupt',
    instructions:
      'Coffee and alcohol are paired with smoking for you. Practice switching the pairing:\n\n1. Hold your cup or glass with both hands.\n2. Take one mindful sip — taste it fully.\n3. Breathe out slowly before the next sip.\n\nYou\'re teaching your brain: this ritual doesn\'t need nicotine.',
    duration_seconds: 60,
  },
}

export interface SessionStatCardData {
  label: string
  value: string
  subtext: string
  emoji: string
}

export function isInjectedStep(stepId?: string): boolean {
  return !!stepId?.startsWith(INJECTED_STEP_PREFIX)
}

export function getSessionStatCard(
  profile: UserProfile,
  dayNumber: number,
  progressStats?: ProgressStats | null
): SessionStatCardData | null {
  if (!STAT_CARD_DAYS.includes(dayNumber as (typeof STAT_CARD_DAYS)[number])) return null

  const daily = profile.daily_consumption || 10
  const packCost = profile.pack_cost || 300
  const minutesPer = profile.minutes_per_cigarette || 7
  const country = profile.country || 'IN'
  const daysFree = progressStats?.days_smoke_free ?? 0
  const moneySaved = progressStats?.money_saved
  const yearlySpend = calculateYearlySpend(daily, packCost)
  const monthlySpend = calculateMonthlySpend(daily, packCost)
  const dailyMinutes = daily * minutesPer

  switch (dayNumber) {
    case 1:
      return {
        emoji: '⏱️',
        label: 'Your daily nicotine time',
        value: `${dailyMinutes} min/day`,
        subtext: `That's ${Math.round((dailyMinutes * 365) / 60)} hours per year on cigarettes — time you can reclaim.`,
      }
    case 5:
      return {
        emoji: '💰',
        label: 'What smoking costs you monthly',
        value: formatMoney(monthlySpend, country),
        subtext: `At ${daily} cigarettes/day, that's ${formatMoney(yearlySpend, country)} every year.`,
      }
    case 10:
      return {
        emoji: '🎯',
        label: daysFree > 0 ? 'Cigarettes avoided so far' : 'Cigarettes you can avoid this year',
        value: daysFree > 0
          ? String(Math.round(daily * daysFree))
          : String(calculateCigarettesAvoidedYear(daily)),
        subtext: daysFree > 0
          ? `${daysFree} day${daysFree !== 1 ? 's' : ''} smoke-free and counting.`
          : 'One year smoke-free starts with today\'s session.',
      }
    case 15:
      return {
        emoji: '🫁',
        label: 'Minutes reclaimed',
        value: daysFree > 0 ? `${daily * minutesPer * daysFree} min` : `${dailyMinutes} min/day waiting`,
        subtext: daysFree > 0
          ? 'Time back that used to go up in smoke.'
          : 'Every smoke-free day adds this back to your life.',
      }
    case 20:
      return {
        emoji: '💵',
        label: 'Money saved',
        value: moneySaved != null && moneySaved > 0
          ? formatMoney(moneySaved, country)
          : formatMoney(yearlySpend, country),
        subtext: moneySaved != null && moneySaved > 0
          ? 'Real cash staying in your pocket.'
          : `Your potential yearly savings if you stay smoke-free.`,
      }
    case 30:
      return {
        emoji: '🏆',
        label: 'Your 30-day impact',
        value: daysFree >= 30
          ? formatMoney((moneySaved ?? 0) || monthlySpend, country)
          : formatMoney(monthlySpend, country),
        subtext: `${calculateCigarettesAvoidedYear(daily).toLocaleString()} cigarettes avoided in a full smoke-free year.`,
      }
    default:
      return null
  }
}

export function buildFallbackTriggerCheck(profile: UserProfile): TriggerCheckContent {
  const trigger = profile.primary_trigger || 'Stress & anxiety'
  return {
    question: `When did you last feel a craving around "${trigger}"?`,
    options: ['Today', 'Yesterday', 'This week', 'Not recently'],
  }
}

/** Step index after which the mid-session comprehension check appears (null if session too short) */
export function getComprehensionCheckpointIndex(stepCount: number): number | null {
  if (stepCount < 3) return null
  return Math.floor(stepCount / 2) - 1
}

const DAY_COMPREHENSION_FALLBACKS: Record<number, Omit<ComprehensionCheckContent, 'question'> & { question?: string }> = {
  1: {
    question: 'What is the main purpose of understanding your smoking pattern?',
    options: [
      'To feel guilty about past choices',
      'To see how the habit works so you can change it sustainably',
      'To prove you have enough willpower',
      'To find excuses to keep smoking',
    ],
    correct_index: 1,
    thought_of_the_day: [
      'Awareness is not guilt—it is power.',
      'The trap only works when you cannot see it clearly.',
    ],
    reread_hint: 'Re-read the opening section—the core idea is about seeing the pattern, not blaming yourself.',
  },
  4: {
    question: 'What does nicotine actually do to stress levels?',
    options: [
      'It permanently lowers cortisol and relaxes you',
      'It temporarily relieves withdrawal, then raises stress overall',
      'It has no effect on stress hormones',
      'It only affects stress when combined with coffee',
    ],
    correct_index: 1,
    thought_of_the_day: [
      'The cigarette did not calm you—it paused the alarm it created.',
      'Real relief comes from breaking the loop, not feeding it.',
    ],
    reread_hint: 'Look back at the section on the relaxation myth—that is today\'s key insight.',
  },
}

export function buildFallbackComprehensionCheck(dayNumber: number, dayTitle?: string): ComprehensionCheckContent {
  const preset = DAY_COMPREHENSION_FALLBACKS[dayNumber]
  if (preset?.question) {
    return preset as ComprehensionCheckContent
  }
  const label = dayTitle || `Day ${dayNumber}`
  return {
    question: `What is the core insight from ${label}?`,
    options: [
      'Willpower alone is the best way to quit',
      'Understanding why you smoke helps lasting change',
      'Cutting down gradually is always enough',
      'Cravings mean you are failing',
    ],
    correct_index: 1,
    thought_of_the_day: [
      'Every paragraph you absorb strengthens your quit muscle.',
      'Understanding beats white-knuckling—take another pass when ready.',
    ],
    reread_hint: 'Scroll back and re-read the main lesson—you may have skimmed past the key point.',
  }
}

export function injectTriggerBranchSteps(
  steps: Step[],
  profile: UserProfile,
  dayNumber: number
): Step[] {
  const trigger = profile.primary_trigger
  if (!trigger) return steps

  const branchDays = TRIGGER_BRANCH_DAYS[trigger]
  if (!branchDays?.includes(dayNumber)) return steps

  const exercise = TRIGGER_EXERCISES[trigger]
  if (!exercise) return steps

  // ponytail: skip if an exercise step already exists early in the session
  const hasEarlyExercise = steps.slice(0, 3).some(s => s.type === StepType.EXERCISE)
  if (hasEarlyExercise) return steps

  const injected: Step = {
    id: `${INJECTED_STEP_PREFIX}trigger-${dayNumber}`,
    program_day: steps[0]?.program_day || '',
    order: -1,
    type: StepType.EXERCISE,
    content_json: {
      title: exercise.title,
      instructions: exercise.instructions,
      duration_seconds: exercise.duration_seconds,
    } satisfies ExerciseStepContent,
  }

  // Insert after first TEXT step, or at start
  const firstNonText = steps.findIndex(s => s.type !== StepType.TEXT)
  const insertAt = firstNonText > 0 ? firstNonText : 1
  const result = [...steps]
  result.splice(Math.min(insertAt, result.length), 0, injected)
  return result
}

export function getTriggerExerciseHint(profile: UserProfile, dayNumber: number): string | undefined {
  const trigger = profile.primary_trigger
  if (!trigger || !TRIGGER_BRANCH_DAYS[trigger]?.includes(dayNumber)) return undefined
  const ex = TRIGGER_EXERCISES[trigger]
  return ex ? `Tailored for your ${trigger.toLowerCase()} trigger:` : undefined
}
