import { pb } from '../lib/pocketbase'
import {
  UserProfile,
  UserBehaviorProfile,
  PersonalizedContent,
  NotificationMessage,
  NotificationTriggerType,
  PersonalizationLog,
  TriggerCheckContent,
  ComprehensionCheckContent,
} from '../types/models'
import { QuitArchetype, CravingTrigger, EmotionalState } from '../types/enums'
import { behaviorProfileService } from './behavior-profile.service'
import { profileService } from './profile.service'
import { buildFallbackTriggerCheck, buildFallbackComprehensionCheck, buildFallbackPersonalizedContent } from '../utils/sessionPersonalization'
import { sanitizePersonalizedText } from '../utils/stepContentFormat'
import { sessionPersonalizationService } from './session-personalization.service'

// ─── Onboarding Context Builder ────────────────────────────────────────────────

function hasMotivation(profile: UserProfile, ...keywords: string[]): boolean {
  return (profile.motivations ?? []).some(m =>
    keywords.some(k => m.toLowerCase().includes(k.toLowerCase()))
  )
}

function buildOnboardingContext(profile: UserProfile): string {
  const lines: string[] = ['ONBOARDING PROFILE:']

  if (profile.onboarding_name) {
    lines.push(`- Preferred Name: ${profile.onboarding_name}`)
  }

  if (profile.language) {
    lines.push(`- Preferred language: ${profile.language}`)
  }

  if (profile.nicotine_forms && profile.nicotine_forms.length > 0) {
    lines.push(`- Nicotine forms: ${profile.nicotine_forms.join(', ')}`)
  }

  if (profile.daily_consumption) {
    const unit = profile.consumption_unit || 'cigarettes'
    lines.push(`- Daily consumption: ${profile.daily_consumption} ${unit}/day`)
  }

  if (profile.pack_cost) {
    lines.push(`- Cost per pack: ${profile.pack_cost}`)
  }

  if (profile.minutes_per_cigarette) {
    lines.push(`- Minutes spent per cigarette: ${profile.minutes_per_cigarette} minutes`)
  }

  if (profile.how_long_using) {
    const years = Math.floor(profile.how_long_using / 12)
    const months = profile.how_long_using % 12
    const duration =
      years > 0
        ? `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`
        : `${months} month${months > 1 ? 's' : ''}`
    lines.push(`- Smoking for: ${duration}`)
  }

  if (profile.started_age_range) {
    lines.push(`- Age started smoking: ${profile.started_age_range}`)
  }

  if (profile.first_use_after_waking) {
    lines.push(`- First use after waking: ${profile.first_use_after_waking}`)
  }

  if (profile.smoking_times && profile.smoking_times.length > 0) {
    lines.push(`- Typical smoking times: ${profile.smoking_times.join(', ')}`)
  }

  if (profile.smoking_environments && profile.smoking_environments.length > 0) {
    lines.push(`- Typical smoking environments: ${profile.smoking_environments.join(', ')}`)
  }

  if (profile.primary_trigger) {
    lines.push(`- Primary trigger: ${profile.primary_trigger}`)
  }

  if (profile.craving_peak_time) {
    lines.push(`- Craving peak time: ${profile.craving_peak_time}`)
  }

  if (profile.daily_stress_level) {
    lines.push(`- Daily stress level: ${profile.daily_stress_level}`)
  }

  if (profile.anxiety_social_pattern) {
    lines.push(`- Anxiety/social pattern: ${profile.anxiety_social_pattern}`)
  }

  if (profile.guilt_frequency) {
    lines.push(`- Guilt frequency: ${profile.guilt_frequency}`)
  }

  if (profile.smoking_triggers && profile.smoking_triggers.length > 0) {
    const triggerLabels: Record<string, string> = {
      [CravingTrigger.STRESS]: 'stress',
      [CravingTrigger.BOREDOM]: 'boredom',
      [CravingTrigger.SOCIAL]: 'social situations',
      [CravingTrigger.HABIT]: 'habit/routine',
      [CravingTrigger.OTHER]: 'other',
    }
    const readable = profile.smoking_triggers.map(t => triggerLabels[t] || t).join(', ')
    lines.push(`- Self-reported triggers: ${readable}`)
  }

  if (profile.emotional_states && profile.emotional_states.length > 0) {
    const stateLabels: Record<string, string> = {
      [EmotionalState.STRESSED]: 'stressed',
      [EmotionalState.ANXIOUS]: 'anxious',
      [EmotionalState.BORED]: 'bored',
      [EmotionalState.LONELY]: 'lonely',
      [EmotionalState.HAPPY]: 'happy',
      [EmotionalState.ANGRY]: 'angry',
      [EmotionalState.SAD_STATE]: 'sad',
      [EmotionalState.EXCITED]: 'excited',
    }
    const readable = profile.emotional_states.map(s => stateLabels[s] || s).join(', ')
    lines.push(`- Emotional states linked to smoking: ${readable}`)
  }

  if (profile.motivations && profile.motivations.length > 0) {
    lines.push(`- Motivations to quit: ${profile.motivations.join(', ')}`)
  }

  if (profile.primary_motivation) {
    lines.push(`- Primary motivation: ${profile.primary_motivation}`)
  }

  if (profile.priority_goal) {
    lines.push(`- Priority goal: ${profile.priority_goal}`)
  }

  if (profile.quit_goal_style) {
    lines.push(`- Quit goal style: ${profile.quit_goal_style}`)
  }

  if (profile.quit_confidence) {
    lines.push(`- Quit confidence: ${profile.quit_confidence}`)
  }

  if (profile.tried_quitting_before) {
    lines.push(`- Previous quit attempts: ${profile.tried_quitting_before}`)
  }

  if (profile.previous_attempt_difficulty && profile.previous_attempt_difficulty.length > 0) {
    lines.push(`- Past quit barriers: ${profile.previous_attempt_difficulty.join(', ')}`)
  }

  if (profile.quit_attempt_count) {
    lines.push(`- Quit attempt count: ${profile.quit_attempt_count}`)
  }

  if (profile.past_quit_tools && profile.past_quit_tools.length > 0) {
    lines.push(`- Past quit tools tried: ${profile.past_quit_tools.join(', ')}`)
  }

  if (profile.cravings_worry) {
    lines.push(`- Cravings worry: ${profile.cravings_worry}`)
  }

  if (profile.relapse_worry) {
    lines.push(`- Relapse worry: ${profile.relapse_worry}`)
  }

  if (profile.withdrawal_worry) {
    lines.push(`- Withdrawal worry: ${profile.withdrawal_worry}`)
  }

  if (profile.household_smokers) {
    lines.push(`- Household smoking environment: ${profile.household_smokers}`)
  }

  if (profile.occupation_style) {
    lines.push(`- Occupation style: ${profile.occupation_style}`)
  }

  if (profile.support_preference) {
    lines.push(`- Support preference: ${profile.support_preference}`)
  }

  if (profile.checkin_time_preference) {
    lines.push(`- Preferred check-in time: ${profile.checkin_time_preference}`)
  }

  if (profile.success_outcome) {
    lines.push(`- Personal success definition: ${profile.success_outcome}`)
  }

  if (profile.commitment_statement) {
    lines.push(`- Commitment statement: ${profile.commitment_statement}`)
  }

  if (profile.readiness_score !== undefined && profile.readiness_score !== null) {
    lines.push(`- Readiness score: ${profile.readiness_score}/100`)
  }

  if (profile.relapse_risk_score !== undefined && profile.relapse_risk_score !== null) {
    lines.push(`- Relapse risk score: ${profile.relapse_risk_score}/100`)
  }

  if (profile.support_intensity_score !== undefined && profile.support_intensity_score !== null) {
    lines.push(`- Support intensity needed: ${profile.support_intensity_score}/100`)
  }

  if (profile.quit_reason && profile.quit_reason.trim()) {
    const reason = profile.quit_reason.trim().slice(0, 200)
    lines.push(`- In their own words: "${reason}"`)
  }

  if (profile.fear_index !== undefined && profile.fear_index !== null) {
    const fearLevel =
      profile.fear_index <= 3
        ? 'low (feels confident about quitting)'
        : profile.fear_index <= 6
          ? 'moderate (some anxiety about quitting)'
          : 'high (significantly worried about quitting)'
    lines.push(`- Fear of quitting: ${profile.fear_index}/10 — ${fearLevel}`)
  }

  if (profile.age) lines.push(`- Age: ${profile.age}`)
  if (profile.gender) lines.push(`- Gender: ${profile.gender}`)
  if (profile.country) lines.push(`- Country: ${profile.country}`)

  return lines.join('\n')
}

// ─── Personalization Rules Derived from Onboarding ───────────────────────────

function buildPersonalizationRules(profile: UserProfile): string {
  const rules: string[] = ['PERSONALIZATION RULES (derived from onboarding):']

  const firstUse = profile.first_use_after_waking?.toLowerCase() ?? ''
  if (firstUse.includes('within 5 minutes') || firstUse.includes('within 30 minutes')) {
    rules.push('- HIGH PHYSICAL DEPENDENCY: First cigarette soon after waking. Focus on physical withdrawal, early morning cravings, and somatic grounding.')
  }

  const stress = profile.daily_stress_level?.toLowerCase() ?? ''
  if (stress.includes('high stress') || stress.includes('overwhelming')) {
    rules.push('- HIGH DAILY STRESS: Offer quick, action-oriented stress-relief and mindfulness coping mechanisms.')
  }

  const guilt = profile.guilt_frequency?.toLowerCase() ?? ''
  if (guilt.includes('every single time') || guilt.includes('frequently')) {
    rules.push('- HIGH GUILT: Keep tone extremely compassionate and gentle. De-escalate self-blame and emphasize recovery.')
  }

  if (profile.fear_index !== undefined) {
    if (profile.fear_index >= 7) {
      rules.push(
        '- HIGH FEAR: Lead with reassurance before any challenge. Avoid urgency language. Validate that fear is normal.'
      )
    } else if (profile.fear_index <= 3) {
      rules.push(
        '- LOW FEAR: User is confident. Skip over-reassurance. Match their energy — direct, capable framing.'
      )
    }
  }

  if (profile.cravings_worry === 'Very worried' || profile.relapse_worry === 'Very worried' || profile.withdrawal_worry === 'Very worried') {
    rules.push('- HIGH WORRY (cravings/relapse/withdrawal): Lead with reassurance and concrete coping tools before any challenge.')
  }

  if (profile.quit_confidence === 'Extremely anxious') {
    rules.push('- EXTREMELY ANXIOUS ABOUT QUITTING: Extra reassurance. Small steps. Never use pressure or countdown language.')
  } else if (profile.quit_confidence === 'A bit nervous / hesitant') {
    rules.push('- NERVOUS ABOUT QUITTING: Validate hesitation as normal. Emphasize support is available.')
  } else if (profile.quit_confidence === 'Very confident') {
    rules.push('- HIGH CONFIDENCE: Match their energy — direct, capable framing without over-reassurance.')
  }

  if (profile.tried_quitting_before === 'Yes, multiple times') {
    rules.push('- REPEAT ATTEMPTER: Frame past attempts as learning, not failure. Build on what they already know.')
  } else if (profile.tried_quitting_before === 'No, this is my first time') {
    rules.push('- FIRST-TIME QUITTER: Explain concepts clearly. Normalize uncertainty without overwhelming detail.')
  }

  if (profile.household_smokers && profile.household_smokers !== 'No, smoke-free household') {
    rules.push('- LIVES WITH SMOKERS: Include boundary-setting and environmental cue management. Acknowledge extra difficulty.')
  }

  if (profile.quit_goal_style === 'I want to reduce first, then quit') {
    rules.push('- GRADUAL QUIT GOAL: Celebrate reduction milestones. Avoid all-or-nothing abstinence framing.')
  } else if (profile.quit_goal_style === 'I have already quit and want to stay smoke-free') {
    rules.push('- ALREADY QUIT: Focus on maintenance, relapse prevention, and identity reinforcement.')
  }

  if (profile.readiness_score !== undefined && profile.readiness_score !== null) {
    if (profile.readiness_score < 40) {
      rules.push('- LOW READINESS: Gentle pacing. Focus on awareness before action.')
    } else if (profile.readiness_score >= 70) {
      rules.push('- HIGH READINESS: User is primed for action. Can handle more direct challenge.')
    }
  }

  if (profile.relapse_risk_score !== undefined && profile.relapse_risk_score >= 60) {
    rules.push('- ELEVATED RELAPSE RISK: Emphasize slip recovery framing. Compassionate re-engagement over guilt.')
  }

  if (profile.support_intensity_score !== undefined && profile.support_intensity_score >= 70) {
    rules.push('- HIGH SUPPORT NEED: More encouragement, check-in language, and explicit validation.')
  }

  if (profile.support_preference?.includes('Quiet')) {
    rules.push('- QUIET PREFERENCE: Keep messages concise and self-directed. No extra cheerleading.')
  } else if (profile.support_preference?.includes('Max support')) {
    rules.push('- MAX SUPPORT PREFERENCE: Warm, encouraging tone with explicit offers of help.')
  }

  if (profile.smoking_triggers?.includes(CravingTrigger.STRESS)) {
    rules.push('- STRESS TRIGGER: Acknowledge stress is real before reframing. Offer a concrete tool.')
  }
  if (profile.smoking_triggers?.includes(CravingTrigger.BOREDOM)) {
    rules.push('- BOREDOM TRIGGER: Reference emptiness/restlessness directly. Frame freedom as gaining engagement.')
  }
  if (profile.smoking_triggers?.includes(CravingTrigger.SOCIAL)) {
    rules.push('- SOCIAL TRIGGER: Acknowledge social pressure is real. Use "others like you" framing.')
  }
  if (profile.smoking_triggers?.includes(CravingTrigger.HABIT)) {
    rules.push('- HABIT TRIGGER: Reference routines. Focus on pattern interruption over willpower.')
  }

  if (profile.emotional_states?.includes(EmotionalState.ANXIOUS)) {
    rules.push('- ANXIETY: One clear action per message. Breathing before cognition.')
  }
  if (profile.emotional_states?.includes(EmotionalState.LONELY)) {
    rules.push('- LONELINESS: Lean into community and "you are not alone" framing.')
  }

  if (profile.daily_consumption && profile.daily_consumption >= 20) {
    rules.push('- HEAVY SMOKER (20+/day): Acknowledge withdrawal will be real. Celebrate micro-wins.')
  }
  if (profile.daily_consumption && profile.daily_consumption <= 5) {
    rules.push('- LIGHT SMOKER (<5/day): Focus on habit/association angle, not physical dependency.')
  }

  if (profile.how_long_using && profile.how_long_using > 120) {
    rules.push('- LONG-TERM SMOKER (10+ years): Acknowledge this is woven into identity. Patient framing.')
  }

  const primaryMot = profile.primary_motivation?.toLowerCase() ?? ''
  if (primaryMot.includes('health') || primaryMot.includes('breathing') || hasMotivation(profile, 'health', 'energetic')) {
    rules.push('- HEALTH MOTIVATION: Safe to reference health improvements and recovery milestones.')
  }
  if (primaryMot.includes('family') || hasMotivation(profile, 'family')) {
    rules.push('- FAMILY MOTIVATION: "The people who matter to you" framing resonates.')
  }
  if (primaryMot.includes('financial') || primaryMot.includes('savings') || hasMotivation(profile, 'money', 'save')) {
    rules.push('- FINANCIAL MOTIVATION: Safe to reference money saved and cost of smoking.')
  }

  if (rules.length === 1) {
    rules.push('- No specific rules override — use archetype defaults.')
  }

  return rules.join('\n')
}

// ─── Main Service ─────────────────────────────────────────────────────────────

class AIPersonalizationService {
  private currentUserId: string = ''
  private contentCache = new Map<string, PersonalizedContent>()

  private cacheKey(userId: string, day: number): string {
    return `${userId}_${day}`
  }

  /**
   * Get personalized session content.
   * Active from Day 1 using onboarding data.
   * Falls back to null if proxy unavailable or rate limited.
   */
  async getPersonalizedSessionContent(
    userId: string,
    dayNumber: number,
    programDayId?: string
  ): Promise<PersonalizedContent | null> {
    this.currentUserId = userId

    const key = this.cacheKey(userId, dayNumber)
    if (this.contentCache.has(key)) {
      const cached = this.contentCache.get(key)!
      sessionPersonalizationService.saveContentPayload(userId, dayNumber, cached, 'cache', programDayId).catch(() => {})
      return cached
    }

    const stored = await sessionPersonalizationService.getStoredPersonalization(userId, dayNumber)
    if (stored) {
      this.contentCache.set(key, stored)
      return stored
    }

    const [userProfileResult, behaviorProfile, sessionHistory, comprehensionStats] = await Promise.all([
      profileService.getByUserId(userId),
      behaviorProfileService.getProfile(userId),
      sessionPersonalizationService.buildSessionHistoryContext(userId, dayNumber),
      sessionPersonalizationService.getComprehensionStats(userId),
    ])

    const userProfile = userProfileResult.success ? userProfileResult.data : null
    if (!userProfile) return null

    let archetype = userProfile.quit_archetype || QuitArchetype.AUTO_PILOT
    if (behaviorProfile && behaviorProfile.learning_phase === 'active') {
      archetype =
        behaviorProfile.archetype_confidence > 0.75
          ? behaviorProfile.behavioral_archetype
          : behaviorProfile.assigned_archetype
    }

    const okfContext = await this.loadOKFContext(archetype, dayNumber, 'session_content')
    const behavioralSection = this.buildBehavioralSection(behaviorProfile)

    const comprehensionHint =
      comprehensionStats.attempts > 0
        ? `User comprehension history: ${comprehensionStats.passes}/${comprehensionStats.attempts} checks passed. ${
            comprehensionStats.passes / comprehensionStats.attempts < 0.5
              ? 'Use simpler language and clearer wrong-option distractors.'
              : 'User engages well with checks.'
          }`
        : ''

    try {
      const response = await this.callProxy('session_content', {
        dayNumber,
        archetype,
        onboardingContext: buildOnboardingContext(userProfile),
        personalizationRules: buildPersonalizationRules(userProfile),
        okfContext: okfContext.context,
        behavioralSection,
        sessionHistory: [sessionHistory, comprehensionHint].filter(Boolean).join('\n\n'),
      })

      const content = this.parseSessionResponse(response)

      const fallbacks = buildFallbackPersonalizedContent(userProfile, dayNumber)
      if (!content.session_intro) content.session_intro = fallbacks.session_intro
      if (!content.exercise_motivation) content.exercise_motivation = fallbacks.exercise_motivation
      if (!content.journal_prompt) content.journal_prompt = fallbacks.journal_prompt
      if (!content.closing_reflection) content.closing_reflection = fallbacks.closing_reflection

      // ponytail: client-side fallback when AI omits optional checks
      if (!content.trigger_check) {
        content.trigger_check = buildFallbackTriggerCheck(userProfile)
      }
      if (!content.comprehension_check) {
        content.comprehension_check = buildFallbackComprehensionCheck(dayNumber)
      }
      // ponytail: day-bank questions test the actual lesson; AI often repeats generic checks
      content.comprehension_check = buildFallbackComprehensionCheck(dayNumber)

      if (content.session_intro || content.trigger_check || content.comprehension_check) {
        this.contentCache.set(key, content)
        if (this.contentCache.size > 5) {
          const firstKey = this.contentCache.keys().next().value
          if (firstKey) this.contentCache.delete(firstKey)
        }
      }

      await sessionPersonalizationService.saveContentPayload(userId, dayNumber, content, 'ai', programDayId)
      await this.logPersonalization(userId, dayNumber, 'session_content', archetype, okfContext.docsLoaded, content)
      return content
    } catch {
      const dbFallback = await sessionPersonalizationService.getStoredPersonalization(userId, dayNumber)
      if (dbFallback) return dbFallback
      return null
    }
  }

  /**
   * Get personalized notification.
   */
  async getPersonalizedNotification(
    userId: string,
    triggerType: NotificationTriggerType,
    dayNumber: number
  ): Promise<NotificationMessage | null> {
    this.currentUserId = userId

    const [userProfileResult, behaviorProfile] = await Promise.all([
      profileService.getByUserId(userId),
      behaviorProfileService.getProfile(userId),
    ])

    const userProfile = userProfileResult.success ? userProfileResult.data : null
    if (!userProfile) return null

    let archetype = userProfile.quit_archetype || QuitArchetype.AUTO_PILOT
    if (behaviorProfile && behaviorProfile.learning_phase === 'active') {
      archetype =
        behaviorProfile.archetype_confidence > 0.75
          ? behaviorProfile.behavioral_archetype
          : behaviorProfile.assigned_archetype
    }

    const [recentCravings, okfContext] = await Promise.all([
      this.getRecentCravings(userId),
      this.loadOKFContext(archetype, dayNumber, 'notification'),
    ])

    const hasRecentSlip = recentCravings.some(c => c.type === 'slip')
    const recentTriggers = [...new Set(recentCravings.slice(0, 5).map(c => c.trigger))].join(', ')
    const behavioralSection = this.buildBehavioralSection(behaviorProfile)

    try {
      const response = await this.callProxy('notification', {
        dayNumber,
        archetype,
        onboardingContext: buildOnboardingContext(userProfile),
        personalizationRules: buildPersonalizationRules(userProfile),
        okfContext: okfContext.context,
        behavioralSection,
        triggerType,
        hasRecentSlip,
        recentTriggers: recentTriggers || 'none logged',
      })

      const message = this.parseNotificationResponse(response, triggerType, archetype)
      await this.logPersonalization(userId, dayNumber, 'notification', archetype, okfContext.docsLoaded)
      return message
    } catch {
      return null
    }
  }

  /**
   * Backoffice transparency
   */
  async getPersonalizationRationale(userId: string): Promise<string> {
    const [userProfileResult, behaviorProfile] = await Promise.all([
      profileService.getByUserId(userId),
      behaviorProfileService.getProfile(userId),
    ])

    const userProfile = userProfileResult.success ? userProfileResult.data : null
    const lines: string[] = []

    if (userProfile) {
      lines.push('── ONBOARDING DATA IN USE ──────────────────')
      lines.push(buildOnboardingContext(userProfile))
      lines.push('')
      lines.push('── PERSONALIZATION RULES ACTIVE ─────────────')
      lines.push(buildPersonalizationRules(userProfile))
    }

    if (behaviorProfile) {
      lines.push('')
      lines.push('── BEHAVIORAL PROFILE ───────────────────────')
      lines.push(`Learning phase: ${behaviorProfile.learning_phase} (${behaviorProfile.days_observed} days observed)`)
      lines.push(`Assigned archetype: ${behaviorProfile.assigned_archetype}`)
      lines.push(`Behavioral archetype: ${behaviorProfile.behavioral_archetype} (confidence: ${(behaviorProfile.archetype_confidence * 100).toFixed(0)}%)`)
      lines.push(`Dominant trigger: ${behaviorProfile.dominant_trigger}`)
      lines.push(`Intensity trend: ${behaviorProfile.intensity_trend}`)
      lines.push(`Mood trend: ${behaviorProfile.mood_trend}`)
      lines.push(`Best notification hour: ${behaviorProfile.best_notification_hour ?? 'unknown'}`)
      lines.push(`Notification style: ${behaviorProfile.best_notification_style}`)
      lines.push(`Notification open rate: ${(behaviorProfile.notification_open_rate * 100).toFixed(0)}%`)
    } else {
      lines.push('')
      lines.push('── BEHAVIORAL PROFILE ───────────────────────')
      lines.push('Not yet computed (user in Days 1-5 observation window).')
      lines.push('Personalization is active using onboarding data only.')
    }

    return lines.join('\n')
  }

  // ─── Private: Proxy Call ───────────────────────────────────────────────────

  private async callProxy(
    requestType: 'session_content' | 'notification',
    context: Record<string, unknown>
  ): Promise<string> {
    const proxyUrl = import.meta.env.VITE_AI_PROXY_URL
    if (!proxyUrl) throw new Error('AI proxy URL not configured')

    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.currentUserId, requestType, context }),
      signal: AbortSignal.timeout(8000),
    })

    if (res.status === 429) throw new Error('rate_limited')
    if (res.status === 503) throw new Error('ai_unavailable')
    if (!res.ok) throw new Error(`proxy_error_${res.status}`)

    const data = await res.json()
    return JSON.stringify(data)
  }

  // ─── Private: Behavioral Section Builder ───────────────────────────────────

  private buildBehavioralSection(behaviorProfile: UserBehaviorProfile | null): string {
    if (behaviorProfile && behaviorProfile.learning_phase === 'active') {
      return `BEHAVIORAL SIGNALS (from ${behaviorProfile.days_observed} days of observation):
- Dominant live trigger: ${behaviorProfile.dominant_trigger}
- Craving intensity trend: ${behaviorProfile.intensity_trend}
- Mood trend: ${behaviorProfile.mood_trend}
- Average session time: ${behaviorProfile.avg_session_minutes} min
- Behavioral archetype: ${behaviorProfile.behavioral_archetype} (confidence: ${(behaviorProfile.archetype_confidence * 100).toFixed(0)}%)`
    }
    return 'BEHAVIORAL SIGNALS:\n- Not yet available (user is in Days 1-5; use onboarding data only)'
  }

  // ─── Private: OKF Context ──────────────────────────────────────────────────

  private async loadOKFContext(
    archetype: QuitArchetype,
    dayNumber: number,
    requestType: string
  ): Promise<{ context: string; docsLoaded: string[] }> {
    const docsLoaded: string[] = []
    const sections: string[] = []

    sections.push(this.getArchetypeContext(archetype))
    docsLoaded.push(`archetypes/${archetype}.md`)

    sections.push(this.getToneContext(archetype))
    docsLoaded.push(`content-variants/tone-${archetype.replace('_', '-')}.md`)

    if (requestType === 'notification') {
      sections.push(this.getNotificationContext())
      docsLoaded.push('notifications/timing-rules.md', 'notifications/escalation-rules.md')
    }

    sections.push(this.getDayContext(dayNumber))
    docsLoaded.push(`program/day-${String(dayNumber).padStart(2, '0')}.md`)

    return { context: sections.join('\n\n---\n\n'), docsLoaded }
  }

  private getArchetypeContext(archetype: QuitArchetype): string {
    const contexts: Record<string, string> = {
      [QuitArchetype.ESCAPIST]: `ARCHETYPE: The Escapist\nSmokes to escape boredom, loneliness, uncomfortable feelings.\nTone: Warm, introspective, imagery-rich. Use metaphor and narrative.\nAvoid: Overly structured checklists, urgent action language, guilt framing.\nPriority days: 5 (Boredom Myth), 18 (Restlessness), 22 (Revelation), 29 (Values).`,
      [QuitArchetype.STRESS_REACTOR]: `ARCHETYPE: The Stress Reactor\nSmokes in response to stress, anxiety, emotional pressure.\nTone: Grounding, immediate, tool-focused. Short sentences.\nAvoid: Long philosophical passages, "just relax", guilt about coping.\nPriority days: 4 (Relaxation Myth), 17 (Stress Toolkit), 27 (Emotional Triggers).`,
      [QuitArchetype.SOCIAL_MIRROR]: `ARCHETYPE: The Social Mirror\nSmoking tied to social identity, influenced by others.\nTone: Community-focused, identity-affirming, uses "we" language.\nAvoid: Isolation advice, implying friends are bad, solo framing.\nPriority days: 14 (Social Pressure), 13 (Coffee/Alcohol), 28 (Rewriting Associations).`,
      [QuitArchetype.AUTO_PILOT]: `ARCHETYPE: The Auto-Pilot Smoker\nSmokes out of habit, often without conscious thought.\nTone: Observational, playful, pattern-interruption focused.\nAvoid: Deep emotional exploration, heavy dramatic framing.\nPriority days: 12 (Triggers & Associations), 13 (Routines), 28 (New Routine Map).`,
    }
    return contexts[archetype] || contexts[QuitArchetype.AUTO_PILOT]
  }

  private getToneContext(archetype: QuitArchetype): string {
    const tones: Record<string, string> = {
      [QuitArchetype.ESCAPIST]: `TONE GUIDE: Warm, curious, gently poetic. Flowing sentences. Nature metaphors. Compassionate, never judgmental.`,
      [QuitArchetype.STRESS_REACTOR]: `TONE GUIDE: Grounded, calm, tool-oriented. Short direct sentences. Fragments OK. Anchoring metaphors (roots, breath, ground). Validate stress as real.`,
      [QuitArchetype.SOCIAL_MIRROR]: `TONE GUIDE: Warm, identity-affirming, community-aware. Conversational. "We" and "us" naturally. Group scenes, belonging imagery. Empowering, never isolating.`,
      [QuitArchetype.AUTO_PILOT]: `TONE GUIDE: Observational, slightly playful. Punchy and concrete. "Notice this. Try that." Gears/switches metaphors. Light, non-heavy. Awareness without intensity.`,
    }
    return tones[archetype] || tones[QuitArchetype.AUTO_PILOT]
  }

  private getNotificationContext(): string {
    return `NOTIFICATION RULES:
- Title: max 60 characters
- Body: max 120 characters
- Never use guilt or shame
- After a slip: compassionate, zero-guilt, frame as data not failure
- Craving spike: lead with immediate relief technique
- Missed session: low-effort re-entry offer
- Frequency cap: max 3/day, min 2h apart
- Night silence: 11 PM – 7 AM`
  }

  private getDayContext(dayNumber: number): string {
    const dayThemes: Record<number, string> = {
      1: 'Seeing the Trap — Psychoeducation & functional analysis',
      2: 'How Nicotine Hooks the Brain — The addiction mechanism',
      3: 'The Pleasure Illusion — Nicotine doesn\'t create pleasure',
      4: 'The Relaxation & Stress Myth — Nicotine raises cortisol',
      5: 'Concentration, Boredom & Confidence Myths',
      6: 'Brainwashing — Where the beliefs came from',
      7: 'Why Willpower & Cutting Down Fail',
      8: 'Nothing to Give Up — Reframing loss as liberation',
      9: 'Preparing for Freedom — Mental rehearsal',
      10: 'Your Reset Moment — The last cigarette (liberation)',
      11: 'Your First Free Day — Navigating novelty',
      12: 'Triggers & Association of Ideas — Mapping triggers',
      13: 'Coffee, Meals & Alcohol — Routine associations',
      14: 'Other Smokers & Social Pressure',
      15: 'The Just One Myth — Why one is never one',
      16: 'Bad Days & Negative Emotions',
      17: 'A Real Stress Toolkit — Grounding techniques',
      18: 'Boredom & Restlessness — Filling the void',
      19: 'The Black Shadows Lift — Mood recovery',
      20: 'Counting the Real Gains — Health, money, time',
      21: 'Energy & A Recovering Body',
      22: 'The Moment of Revelation — Deep identity shift',
      23: 'Guarding Against Complacency',
      24: 'Your High-Risk Situations Plan',
      25: 'If You Slip — Compassionate response protocol',
      26: 'Weight & Eating Worries',
      27: 'Emotional Triggers — Deep pattern work',
      28: 'Rewriting Old Associations',
      29: 'Your Values & The Life You\'re Building',
      30: 'Free for Life — Lifelong non-smoker identity',
    }
    return `PROGRAM DAY ${dayNumber}: ${dayThemes[dayNumber] || 'Unknown'}`
  }

  // ─── Private: Parsers ─────────────────────────────────────────────────────

  private parseSessionResponse(raw: string): PersonalizedContent {
    try {
      const parsed = JSON.parse(raw)
      let trigger_check: TriggerCheckContent | undefined
      if (parsed.trigger_check?.question && Array.isArray(parsed.trigger_check.options)) {
        const options = parsed.trigger_check.options
          .filter((o: unknown) => typeof o === 'string')
          .slice(0, 4)
        if (options.length >= 2) {
          trigger_check = {
            question: sanitizePersonalizedText(String(parsed.trigger_check.question)).slice(0, 200),
            options: options.map((o: string) => sanitizePersonalizedText(o)),
          }
        }
      }

      let comprehension_check: ComprehensionCheckContent | undefined
      const cc = parsed.comprehension_check
      if (cc?.question && Array.isArray(cc.options) && cc.options.length >= 2) {
        const options = cc.options.filter((o: unknown) => typeof o === 'string').slice(0, 4)
        const correct_index = Number(cc.correct_index)
        const thoughtRaw = cc.thought_of_the_day
        const thought: [string, string] = Array.isArray(thoughtRaw) && thoughtRaw.length >= 2
          ? [String(thoughtRaw[0]).slice(0, 120), String(thoughtRaw[1]).slice(0, 120)]
          : ['Pause. Breathe.', 'Understanding grows when you give it a second pass.']
        if (options.length >= 2 && correct_index >= 0 && correct_index < options.length) {
          comprehension_check = {
            question: sanitizePersonalizedText(String(cc.question)).slice(0, 250),
            options: options.map((o: string) => sanitizePersonalizedText(o)),
            correct_index,
            thought_of_the_day: [
              sanitizePersonalizedText(thought[0]),
              sanitizePersonalizedText(thought[1]),
            ],
            reread_hint: sanitizePersonalizedText(
              String(cc.reread_hint || 'Re-read the earlier sections before continuing.')
            ).slice(0, 150),
          }
        }
      }

      const clean = (v: unknown) =>
        typeof v === 'string' ? sanitizePersonalizedText(v) : undefined

      return {
        session_intro: clean(parsed.session_intro),
        exercise_motivation: clean(parsed.exercise_motivation),
        closing_reflection: clean(parsed.closing_reflection),
        journal_prompt: clean(parsed.journal_prompt),
        trigger_check,
        comprehension_check,
      }
    } catch {
      return {}
    }
  }

  private parseNotificationResponse(
    raw: string,
    triggerType: NotificationTriggerType,
    archetype: QuitArchetype
  ): NotificationMessage {
    try {
      const parsed = JSON.parse(raw)
      return {
        title: (parsed.title || 'Check in').slice(0, 60),
        body: (parsed.body || 'Your session is ready.').slice(0, 120),
        trigger_type: triggerType,
        archetype,
      }
    } catch {
      return {
        title: 'Your session awaits',
        body: 'A few minutes of clarity. Open when ready.',
        trigger_type: triggerType,
        archetype,
      }
    }
  }

  // ─── Private: Helpers ─────────────────────────────────────────────────────

  private async getRecentCravings(userId: string): Promise<any[]> {
    try {
      return await pb.collection('cravings').getFullList({
        filter: `user="${userId}"`,
        sort: '-id',
      })
    } catch {
      return []
    }
  }

  private async logPersonalization(
    userId: string,
    dayNumber: number,
    requestType: 'session_content' | 'notification' | 'behavior_update',
    archetype: QuitArchetype,
    docsLoaded: string[],
    contentPayload?: PersonalizedContent
  ): Promise<void> {
    try {
      await pb.collection('personalization_logs').create({
        user: userId,
        day_number: dayNumber,
        request_type: requestType,
        archetype_used: archetype,
        okf_docs_loaded: docsLoaded,
        ai_response_summary: `Generated ${requestType} for ${archetype} on day ${dayNumber}`,
        ...(contentPayload ? { content_payload: contentPayload } : {}),
      } satisfies Omit<PersonalizationLog, 'id' | 'created' | 'content_fit_score'> & { content_payload?: PersonalizedContent })
    } catch { /* non-critical */ }
  }
}

export const aiService = new AIPersonalizationService()
