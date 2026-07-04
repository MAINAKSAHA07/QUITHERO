import { pb } from '../lib/pocketbase'
import {
  UserProfile,
  UserBehaviorProfile,
  PersonalizedContent,
  NotificationMessage,
  NotificationTriggerType,
  PersonalizationLog,
} from '../types/models'
import { QuitArchetype, CravingTrigger, EmotionalState } from '../types/enums'
import { behaviorProfileService } from './behavior-profile.service'
import { profileService } from './profile.service'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// ─── Onboarding Context Builder ────────────────────────────────────────────────

function buildOnboardingContext(profile: UserProfile): string {
  const lines: string[] = ['ONBOARDING PROFILE:']

  if (profile.daily_consumption) {
    const unit = profile.consumption_unit || 'cigarettes'
    lines.push(`- Daily consumption: ${profile.daily_consumption} ${unit}/day`)
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

  if (profile.fear_index !== undefined) {
    if (profile.fear_index >= 7) {
      rules.push(
        '- HIGH FEAR: Lead with reassurance before any challenge. ' +
        'Avoid urgency language. Validate that fear is normal.'
      )
    } else if (profile.fear_index <= 3) {
      rules.push(
        '- LOW FEAR: User is confident. Skip over-reassurance. ' +
        'Match their energy — direct, capable framing.'
      )
    }
  }

  if (profile.smoking_triggers?.includes(CravingTrigger.STRESS)) {
    rules.push(
      '- STRESS TRIGGER: When stress appears, acknowledge it is real before reframing. ' +
      'Never dismiss stress. Offer a concrete tool (breathing, grounding) alongside the insight.'
    )
  }
  if (profile.smoking_triggers?.includes(CravingTrigger.BOREDOM)) {
    rules.push(
      '- BOREDOM TRIGGER: Reference the feeling of emptiness or restlessness directly. ' +
      'Frame freedom as gaining engagement, not just removing a habit.'
    )
  }
  if (profile.smoking_triggers?.includes(CravingTrigger.SOCIAL)) {
    rules.push(
      '- SOCIAL TRIGGER: Acknowledge that social situations are real pressure. ' +
      'Do not make the user feel isolated. Use "others like you" framing where natural.'
    )
  }
  if (profile.smoking_triggers?.includes(CravingTrigger.HABIT)) {
    rules.push(
      '- HABIT TRIGGER: Reference specific routines (morning coffee, after meals) ' +
      'when relevant. Focus on pattern interruption over willpower.'
    )
  }

  if (profile.emotional_states?.includes(EmotionalState.ANXIOUS)) {
    rules.push(
      '- ANXIETY: Avoid overwhelming with too many ideas at once. ' +
      'One clear action per message. Breathing or grounding before cognition.'
    )
  }
  if (profile.emotional_states?.includes(EmotionalState.LONELY)) {
    rules.push(
      '- LONELINESS: Lean into community, shared experience, and "you are not alone" framing.'
    )
  }

  if (profile.daily_consumption && profile.daily_consumption >= 20) {
    rules.push(
      '- HEAVY SMOKER (20+/day): Acknowledge that withdrawal will be real. ' +
      'Do not minimise Days 2-4. Celebrate micro-wins (hours, not just days).'
    )
  }
  if (profile.daily_consumption && profile.daily_consumption <= 5) {
    rules.push(
      '- LIGHT SMOKER (<5/day): Avoid language implying they are deeply addicted. ' +
      'Focus on the habit and association angle, not the physical dependency angle.'
    )
  }

  if (profile.how_long_using && profile.how_long_using > 120) {
    rules.push(
      '- LONG-TERM SMOKER (10+ years): Acknowledge this is deeply woven into identity. ' +
      'Be patient in framing — this is not a quick fix, it is a genuine reset.'
    )
  }

  if (profile.motivations?.includes('health')) {
    rules.push(
      '- HEALTH MOTIVATION: Safe to reference health improvements and recovery milestones.'
    )
  }
  if (profile.motivations?.includes('family')) {
    rules.push(
      '- FAMILY MOTIVATION: Reference loved ones where natural. ' +
      '"The people who matter to you" framing resonates.'
    )
  }
  if (profile.motivations?.includes('money') || profile.motivations?.includes('financial')) {
    rules.push(
      '- FINANCIAL MOTIVATION: Safe to reference money saved and cost of smoking.'
    )
  }

  if (rules.length === 1) {
    rules.push('- No specific rules override — use archetype defaults.')
  }

  return rules.join('\n')
}

// ─── Main Service ─────────────────────────────────────────────────────────────

class AIPersonalizationService {
  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  }

  /**
   * Get personalized session content.
   * Active from Day 1 onward using onboarding data.
   * Days 6+: additionally uses behavioral signals once learning_phase = 'active'.
   * Falls back to null (static content) only if AI call fails or no API key.
   */
  async getPersonalizedSessionContent(
    userId: string,
    dayNumber: number
  ): Promise<PersonalizedContent | null> {
    if (!this.apiKey) return null

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

    const okfContext = await this.loadOKFContext(archetype, dayNumber, 'session_content')
    const prompt = this.buildSessionPrompt(userProfile, behaviorProfile, dayNumber, archetype, okfContext)

    try {
      const response = await this.callGemini(prompt)
      const content = this.parseSessionResponse(response)
      await this.logPersonalization(userId, dayNumber, 'session_content', archetype, okfContext.docsLoaded)
      return content
    } catch {
      return null
    }
  }

  /**
   * Get personalized notification.
   * Now includes full onboarding context in the prompt.
   */
  async getPersonalizedNotification(
    userId: string,
    triggerType: NotificationTriggerType,
    dayNumber: number
  ): Promise<NotificationMessage | null> {
    if (!this.apiKey) return null

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

    const prompt = this.buildNotificationPrompt(
      userProfile, behaviorProfile, triggerType, dayNumber, archetype, recentCravings, okfContext
    )

    try {
      const response = await this.callGemini(prompt)
      const message = this.parseNotificationResponse(response, triggerType, archetype)
      await this.logPersonalization(userId, dayNumber, 'notification', archetype, okfContext.docsLoaded)
      return message
    } catch {
      return null
    }
  }

  /**
   * Backoffice transparency — shows onboarding data that is feeding prompts
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

  // ─── Private: Prompt Builders ──────────────────────────────────────────────

  private buildSessionPrompt(
    userProfile: UserProfile,
    behaviorProfile: UserBehaviorProfile | null,
    dayNumber: number,
    archetype: QuitArchetype,
    okfContext: { context: string }
  ): string {
    const behavioralSection = behaviorProfile && behaviorProfile.learning_phase === 'active'
      ? `
BEHAVIORAL SIGNALS (from ${behaviorProfile.days_observed} days of observation):
- Dominant live trigger: ${behaviorProfile.dominant_trigger}
- Craving intensity trend: ${behaviorProfile.intensity_trend}
- Mood trend: ${behaviorProfile.mood_trend}
- Average session time: ${behaviorProfile.avg_session_minutes} min
- Behavioral archetype: ${behaviorProfile.behavioral_archetype} (confidence: ${(behaviorProfile.archetype_confidence * 100).toFixed(0)}%)`
      : `
BEHAVIORAL SIGNALS:
- Not yet available (user is in Days 1-5; use onboarding data only)`

    return `You are the personalization engine for Smono, a 30-day CBT-based quit-smoking app.

KNOWLEDGE CONTEXT:
${okfContext.context}

${buildOnboardingContext(userProfile)}

ARCHETYPE: ${archetype}
${behavioralSection}

${buildPersonalizationRules(userProfile)}

TASK: Generate personalized content insertions for Day ${dayNumber}.

HARD RULES:
- Never mention "archetype", "CBT", "personalization", or any system internals to the user
- Never quote back their own words verbatim — translate into insight
- Non-stigmatizing and trauma-informed at all times
- Second-person ("you"), present tense
- Do not invent facts about the user beyond what is given
- If fear_index is high (>=7): lead with reassurance in the session_intro
- session_intro: max 120 words
- exercise_motivation: max 60 words
- closing_reflection: max 100 words
- journal_prompt: one specific question, max 30 words

Respond with ONLY valid JSON (no markdown, no preamble):
{
  "session_intro": "...",
  "exercise_motivation": "...",
  "closing_reflection": "...",
  "journal_prompt": "..."
}`
  }

  private buildNotificationPrompt(
    userProfile: UserProfile,
    behaviorProfile: UserBehaviorProfile | null,
    triggerType: NotificationTriggerType,
    dayNumber: number,
    archetype: QuitArchetype,
    recentCravings: any[],
    okfContext: { context: string }
  ): string {
    const hasRecentSlip = recentCravings.some(c => c.type === 'slip')
    const recentTriggers = [...new Set(recentCravings.slice(0, 5).map(c => c.trigger))].join(', ')

    const behavioralSection = behaviorProfile && behaviorProfile.learning_phase === 'active'
      ? `Intensity trend: ${behaviorProfile.intensity_trend} | Mood trend: ${behaviorProfile.mood_trend}`
      : 'Behavioral data not yet available (Days 1-5)'

    return `You are the notification engine for Smono, a 30-day CBT quit-smoking app.

KNOWLEDGE CONTEXT:
${okfContext.context}

${buildOnboardingContext(userProfile)}

${buildPersonalizationRules(userProfile)}

NOTIFICATION CONTEXT:
- Archetype: ${archetype}
- Day: ${dayNumber}
- Trigger type: ${triggerType}
- Recent cravings (48h): ${recentCravings.length}
- Has recent slip: ${hasRecentSlip}
- Recent triggers: ${recentTriggers || 'none logged'}
- ${behavioralSection}

TASK: Generate ONE notification for trigger type "${triggerType}".

HARD RULES:
- Title: max 60 characters
- Body: max 120 characters
- NEVER use guilt or shame
- NEVER mention "archetype" or system internals
${hasRecentSlip ? '- SLIP DETECTED: compassionate only, zero-guilt, frame as data not failure' : ''}
- Make it specific to their triggers/motivations where possible
- Actionable — the user should know what to do next

Respond with ONLY valid JSON:
{
  "title": "...",
  "body": "..."
}`
  }

  // ─── Private: OKF Context ──────────────────────────────────────────────────

  private async loadOKFContext(
    archetype: QuitArchetype,
    dayNumber: number,
    requestType: string
  ): Promise<{ context: string; docsLoaded: string[] }> {
    const docsLoaded: string[] = []
    const sections: string[] = []

    const archetypeDoc = this.getArchetypeContext(archetype)
    sections.push(archetypeDoc)
    docsLoaded.push(`archetypes/${archetype}.md`)

    const toneDoc = this.getToneContext(archetype)
    sections.push(toneDoc)
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

  // ─── Private: Gemini ──────────────────────────────────────────────────────

  private async callGemini(prompt: string): Promise<string> {
    const res = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  // ─── Private: Parsers ─────────────────────────────────────────────────────

  private parseSessionResponse(raw: string): PersonalizedContent {
    try {
      const parsed = JSON.parse(raw)
      return {
        session_intro: parsed.session_intro || undefined,
        exercise_motivation: parsed.exercise_motivation || undefined,
        closing_reflection: parsed.closing_reflection || undefined,
        journal_prompt: parsed.journal_prompt || undefined,
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
    docsLoaded: string[]
  ): Promise<void> {
    try {
      await pb.collection('personalization_logs').create({
        user: userId,
        day_number: dayNumber,
        request_type: requestType,
        archetype_used: archetype,
        okf_docs_loaded: docsLoaded,
        ai_response_summary: `Generated ${requestType} for ${archetype} on day ${dayNumber}`,
      } satisfies Omit<PersonalizationLog, 'id' | 'created' | 'content_fit_score'>)
    } catch { /* non-critical */ }
  }
}

export const aiService = new AIPersonalizationService()
