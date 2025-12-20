import { CravingTrigger, EmotionalState, QuitArchetype } from '../types/enums'

/**
 * Assigns a Quit Archetype based on user's smoking triggers and emotional states
 *
 * Logic:
 * - The Escapist: Primarily triggered by boredom and lonely feelings
 * - The Stress Reactor: Primarily triggered by stress and anxious/angry feelings
 * - The Social Mirror: Primarily triggered by social situations
 * - The Auto-Pilot Smoker: Primarily triggered by habit
 */
export function assignQuitArchetype(
  triggers: CravingTrigger[],
  emotionalStates: EmotionalState[]
): QuitArchetype {
  // Create scoring object
  const scores = {
    [QuitArchetype.ESCAPIST]: 0,
    [QuitArchetype.STRESS_REACTOR]: 0,
    [QuitArchetype.SOCIAL_MIRROR]: 0,
    [QuitArchetype.AUTO_PILOT]: 0,
  }

  // Score based on triggers
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
      case CravingTrigger.OTHER:
        // Don't heavily influence score
        break
    }
  })

  // Score based on emotional states
  emotionalStates.forEach((state) => {
    switch (state) {
      case EmotionalState.BORED:
        scores[QuitArchetype.ESCAPIST] += 2
        break
      case EmotionalState.LONELY:
        scores[QuitArchetype.ESCAPIST] += 2
        break
      case EmotionalState.STRESSED:
        scores[QuitArchetype.STRESS_REACTOR] += 2
        break
      case EmotionalState.ANXIOUS:
        scores[QuitArchetype.STRESS_REACTOR] += 2
        break
      case EmotionalState.ANGRY:
        scores[QuitArchetype.STRESS_REACTOR] += 1
        break
      case EmotionalState.HAPPY:
        scores[QuitArchetype.SOCIAL_MIRROR] += 1
        break
      case EmotionalState.EXCITED:
        scores[QuitArchetype.SOCIAL_MIRROR] += 1
        break
      case EmotionalState.SAD_STATE:
        scores[QuitArchetype.ESCAPIST] += 1
        break
    }
  })

  // Find the archetype with highest score
  let maxScore = -1
  let assignedArchetype = QuitArchetype.AUTO_PILOT // Default fallback

  Object.entries(scores).forEach(([archetype, score]) => {
    if (score > maxScore) {
      maxScore = score
      assignedArchetype = archetype as QuitArchetype
    }
  })

  // If no clear winner (all zeros or tie), default to AUTO_PILOT
  if (maxScore === 0) {
    return QuitArchetype.AUTO_PILOT
  }

  return assignedArchetype
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
