import { CravingTrigger, EmotionalState, QuitArchetype } from '../types/enums'
import { UserProfile } from '../types/models'

export interface ArchetypeScoringResult {
  assignedArchetype: QuitArchetype
  secondaryArchetype?: QuitArchetype
  readinessScore: number
  relapseRiskScore: number
  supportIntensityScore: number
}

/**
 * Legacy assignment function (kept for backward compatibility)
 */
export function assignQuitArchetype(
  triggers: CravingTrigger[],
  emotionalStates: EmotionalState[]
): QuitArchetype {
  const scores = {
    [QuitArchetype.ESCAPIST]: 0,
    [QuitArchetype.STRESS_REACTOR]: 0,
    [QuitArchetype.SOCIAL_MIRROR]: 0,
    [QuitArchetype.AUTO_PILOT]: 0,
  }

  triggers.forEach((trigger) => {
    switch (trigger) {
      case CravingTrigger.BOREDOM:
        scores[QuitArchetype.ESCAPIST] += 3
        break
      case CravingTrigger.STRESS:
        scores[QuitArchetype.STRESS_REACTOR] += 3
        break
      case CravingTrigger.SOCIAL:
        scores[QuitArchetype.SOCIAL_MIRROR] += 3
        break
      case CravingTrigger.HABIT:
        scores[QuitArchetype.AUTO_PILOT] += 3
        break
    }
  })

  emotionalStates.forEach((state) => {
    switch (state) {
      case EmotionalState.BORED:
      case EmotionalState.LONELY:
        scores[QuitArchetype.ESCAPIST] += 2
        break
      case EmotionalState.STRESSED:
      case EmotionalState.ANXIOUS:
        scores[QuitArchetype.STRESS_REACTOR] += 2
        break
      case EmotionalState.ANGRY:
        scores[QuitArchetype.STRESS_REACTOR] += 1
        break
      case EmotionalState.HAPPY:
      case EmotionalState.EXCITED:
        scores[QuitArchetype.SOCIAL_MIRROR] += 1
        break
      case EmotionalState.SAD_STATE:
        scores[QuitArchetype.ESCAPIST] += 1
        break
    }
  })

  let maxScore = -1
  let assignedArchetype = QuitArchetype.AUTO_PILOT

  Object.entries(scores).forEach(([archetype, score]) => {
    if (score > maxScore) {
      maxScore = score
      assignedArchetype = archetype as QuitArchetype
    }
  })

  return maxScore === 0 ? QuitArchetype.AUTO_PILOT : assignedArchetype
}

/**
 * Detailed assignment function that parses the entire UserProfile
 * and returns primary/secondary archetypes along with readiness,
 * relapse risk, and support intensity scores.
 */
export function assignDetailedQuitArchetype(profile: Partial<UserProfile>): ArchetypeScoringResult {
  const scores = {
    [QuitArchetype.ESCAPIST]: 0,
    [QuitArchetype.STRESS_REACTOR]: 0,
    [QuitArchetype.SOCIAL_MIRROR]: 0,
    [QuitArchetype.AUTO_PILOT]: 0,
  }

  // 1. Core Triggers & Emotional States
  const triggers = profile.smoking_triggers || []
  const emotionalStates = profile.emotional_states || []

  triggers.forEach((trigger) => {
    if (trigger === CravingTrigger.BOREDOM) scores[QuitArchetype.ESCAPIST] += 4;
    if (trigger === CravingTrigger.STRESS) scores[QuitArchetype.STRESS_REACTOR] += 4;
    if (trigger === CravingTrigger.SOCIAL) scores[QuitArchetype.SOCIAL_MIRROR] += 4;
    if (trigger === CravingTrigger.HABIT) scores[QuitArchetype.AUTO_PILOT] += 4;
  })

  emotionalStates.forEach((state) => {
    if (state === EmotionalState.BORED || state === EmotionalState.LONELY) {
      scores[QuitArchetype.ESCAPIST] += 3;
    }
    if (state === EmotionalState.STRESSED || state === EmotionalState.ANXIOUS) {
      scores[QuitArchetype.STRESS_REACTOR] += 3;
    }
    if (state === EmotionalState.ANGRY || state === EmotionalState.SAD_STATE) {
      scores[QuitArchetype.ESCAPIST] += 2;
      scores[QuitArchetype.STRESS_REACTOR] += 1;
    }
    if (state === EmotionalState.HAPPY || state === EmotionalState.EXCITED) {
      scores[QuitArchetype.SOCIAL_MIRROR] += 2;
    }
  })

  // 2. Extra Profile Details Scoring
  
  // Escapist cues
  if (profile.smoking_times?.includes('When bored')) scores[QuitArchetype.ESCAPIST] += 3;
  if (profile.smoking_times?.includes('Before sleeping')) scores[QuitArchetype.ESCAPIST] += 2;
  if (profile.smoking_environments?.includes('Alone at home')) scores[QuitArchetype.ESCAPIST] += 3;
  if (profile.primary_trigger === 'Boredom / driving') scores[QuitArchetype.ESCAPIST] += 3;
  if (profile.craving_peak_time === 'Late at night') scores[QuitArchetype.ESCAPIST] += 2;
  if (profile.guilt_frequency === 'Every single time I smoke' || profile.guilt_frequency === 'Frequently') {
    scores[QuitArchetype.ESCAPIST] += 2;
  }

  // Stress Reactor cues
  if (profile.smoking_times?.includes('When stressed')) scores[QuitArchetype.STRESS_REACTOR] += 3;
  if (profile.smoking_times?.includes('During work breaks')) scores[QuitArchetype.STRESS_REACTOR] += 2;
  if (profile.smoking_environments?.includes('Stressful moments')) scores[QuitArchetype.STRESS_REACTOR] += 3;
  if (profile.smoking_environments?.includes('Work breaks')) scores[QuitArchetype.STRESS_REACTOR] += 1;
  if (profile.primary_trigger === 'Stress & anxiety') scores[QuitArchetype.STRESS_REACTOR] += 4;
  if (profile.daily_stress_level === 'High stress' || profile.daily_stress_level === 'Overwhelming stress') {
    scores[QuitArchetype.STRESS_REACTOR] += 3;
  }
  if (profile.anxiety_social_pattern === 'Mostly when anxious / alone') scores[QuitArchetype.STRESS_REACTOR] += 3;
  if (profile.occupation_style === 'Desk job / office worker') scores[QuitArchetype.STRESS_REACTOR] += 1;

  // Social Mirror cues
  if (profile.smoking_times?.includes('While socializing')) scores[QuitArchetype.SOCIAL_MIRROR] += 3;
  if (profile.smoking_times?.includes('When drinking alcohol')) scores[QuitArchetype.SOCIAL_MIRROR] += 3;
  if (profile.smoking_environments?.includes('Socializing with friends')) scores[QuitArchetype.SOCIAL_MIRROR] += 3;
  if (profile.primary_trigger === 'Social pressure') scores[QuitArchetype.SOCIAL_MIRROR] += 4;
  if (profile.anxiety_social_pattern === 'Mostly when socializing / drinking') scores[QuitArchetype.SOCIAL_MIRROR] += 3;
  if (profile.household_smokers && profile.household_smokers !== 'No, smoke-free household') {
    scores[QuitArchetype.SOCIAL_MIRROR] += 2;
  }

  // Auto-Pilot cues
  if (profile.smoking_times?.includes('First thing in the morning')) scores[QuitArchetype.AUTO_PILOT] += 3;
  if (profile.smoking_times?.includes('After meals')) scores[QuitArchetype.AUTO_PILOT] += 3;
  if (profile.smoking_times?.includes('With coffee or tea')) scores[QuitArchetype.AUTO_PILOT] += 2;
  if (profile.smoking_times?.includes('While driving or commuting')) scores[QuitArchetype.AUTO_PILOT] += 2;
  if (profile.smoking_environments?.includes('Driving / commuting')) scores[QuitArchetype.AUTO_PILOT] += 2;
  if (profile.primary_trigger === 'Finishing meals') scores[QuitArchetype.AUTO_PILOT] += 3;
  if (profile.first_use_after_waking === 'Within 5 minutes' || profile.first_use_after_waking === 'Within 30 minutes') {
    scores[QuitArchetype.AUTO_PILOT] += 3;
  }

  // Sort and assign primary/secondary archetypes
  const sortedArchetypes = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([archetype]) => archetype as QuitArchetype)

  const primary = sortedArchetypes[0]
  const secondaryCandidate = sortedArchetypes[1]
  
  // Set secondary archetype if the score difference is close (<= 2 points) and primary score is > 0
  const primaryScore = scores[primary]
  const secondaryScore = scores[secondaryCandidate]
  const secondary = (primaryScore > 0 && (primaryScore - secondaryScore <= 2)) ? secondaryCandidate : undefined

  // 3. Readiness, Relapse Risk, and Support Intensity Scores
  let readiness = 50
  let relapseRisk = 40
  let supportIntensity = 50

  // Readiness calculation
  if (profile.primary_motivation === 'Physical health / breathing quality') readiness += 15
  if (profile.primary_motivation === 'Family & loved ones') readiness += 15
  if (profile.primary_motivation === 'Self-confidence / freedom') readiness += 15
  
  if (profile.quit_confidence === 'Very confident') readiness += 20
  if (profile.quit_confidence === 'Moderately confident') readiness += 10
  if (profile.quit_confidence === 'A bit nervous / hesitant') readiness -= 10
  if (profile.quit_confidence === 'Extremely anxious') readiness -= 20

  if (profile.quit_goal_style === 'I want to quit completely') readiness += 15
  if (profile.quit_goal_style === 'I want to reduce first, then quit') readiness += 5
  if (profile.quit_goal_style === 'I have already quit and want to stay smoke-free') readiness += 15

  if (profile.commitment_statement === 'I commit to my smoke-free future') readiness += 10
  if (profile.commitment_statement === 'I commit to taking it day by day') readiness += 5

  // Relapse Risk calculation
  if (profile.daily_stress_level === 'Overwhelming stress') relapseRisk += 30
  if (profile.daily_stress_level === 'High stress') relapseRisk += 20
  if (profile.daily_stress_level === 'Moderate stress') relapseRisk += 10

  if (profile.cravings_worry === 'Very worried') relapseRisk += 15
  if (profile.cravings_worry === 'Slightly worried') relapseRisk += 5
  if (profile.relapse_worry === 'Very worried') relapseRisk += 15
  if (profile.relapse_worry === 'Slightly worried') relapseRisk += 5
  if (profile.withdrawal_worry === 'Very worried') relapseRisk += 10

  if (profile.household_smokers && profile.household_smokers !== 'No, smoke-free household') relapseRisk += 15
  
  if (profile.quit_confidence === 'Extremely anxious') relapseRisk += 15
  if (profile.quit_confidence === 'A bit nervous / hesitant') relapseRisk += 5
  if (profile.quit_confidence === 'Very confident') relapseRisk -= 15

  // Support Intensity calculation
  if (profile.support_preference === 'Max support: reminders, quotes, SOS support') supportIntensity += 30
  if (profile.support_preference === 'Balanced: standard daily modules only') supportIntensity += 10
  if (profile.support_preference === 'Quiet: self-guided, no extra notifications') supportIntensity -= 20

  if (profile.quit_confidence === 'Extremely anxious') supportIntensity += 20
  if (profile.quit_confidence === 'A bit nervous / hesitant') supportIntensity += 10
  if (profile.daily_stress_level === 'Overwhelming stress') supportIntensity += 10
  if (profile.cravings_worry === 'Very worried') supportIntensity += 10

  // Constrain scores between 0 and 100
  const clamp = (val: number) => Math.min(Math.max(val, 0), 100)

  return {
    assignedArchetype: primary,
    secondaryArchetype: secondary,
    readinessScore: clamp(readiness),
    relapseRiskScore: clamp(relapseRisk),
    supportIntensityScore: clamp(supportIntensity),
  }
}

/**
 * Get archetype display information
 */
export function getArchetypeInfo(archetype: QuitArchetype): {
  name: string
  description: string
  icon: string
  characteristics: string[]
} {
  switch (archetype) {
    case QuitArchetype.ESCAPIST:
      return {
        name: 'The Escapist',
        description: 'You tend to smoke when bored or seeking distraction from uncomfortable feelings.',
        icon: '🌊',
        characteristics: [
          'Smokes when feeling bored or restless',
          'Uses smoking to escape uncomfortable emotions',
          'Often smokes alone',
          'May struggle with emptiness or loneliness',
        ],
      }
    case QuitArchetype.STRESS_REACTOR:
      return {
        name: 'The Stress Reactor',
        description: 'You primarily smoke in response to stress, anxiety, or emotional pressure.',
        icon: '⚡',
        characteristics: [
          'Reaches for cigarettes during stressful situations',
          'Uses smoking to cope with anxiety',
          'Cravings increase under pressure',
          'Smoking feels like a quick stress relief',
        ],
      }
    case QuitArchetype.SOCIAL_MIRROR:
      return {
        name: 'The Social Mirror',
        description: 'Your smoking is heavily influenced by social situations and being around other smokers.',
        icon: '👥',
        characteristics: [
          'Smokes more in social settings',
          'Influenced by others who smoke',
          'Uses smoking as a social tool',
          'May feel left out when not smoking with others',
        ],
      }
    case QuitArchetype.AUTO_PILOT:
      return {
        name: 'The Auto-Pilot Smoker',
        description: 'You smoke out of habit and routine, often without conscious thought.',
        icon: '🔄',
        characteristics: [
          'Smokes at specific times or places automatically',
          'Often doesn\'t realize when lighting up',
          'Strongly tied to daily routines',
          'May smoke without actually wanting to',
        ],
      }
  }
}
