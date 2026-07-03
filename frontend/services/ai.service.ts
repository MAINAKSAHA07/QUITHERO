import { pb } from '../lib/pocketbase'
import { 
  UserBehaviorProfile, PersonalizedContent, NotificationMessage, 
  NotificationTriggerType, PersonalizationLog 
} from '../types/models'
import { QuitArchetype } from '../types/enums'
import { behaviorProfileService } from './behavior-profile.service'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/**
 * AI Personalization Service
 * Uses Gemini API with OKF knowledge documents as context to generate
 * personalized content and notifications.
 */
class AIPersonalizationService {

  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  }

  /**
   * Get personalized session content for Day 6+
   * Falls back to null (static content used) if AI unavailable
   */
  async getPersonalizedSessionContent(
    userId: string,
    dayNumber: number
  ): Promise<PersonalizedContent | null> {
    const profile = await behaviorProfileService.getProfile(userId)
    if (!profile || profile.learning_phase !== 'active') return null

    const archetype = profile.archetype_confidence > 0.75
      ? profile.behavioral_archetype
      : profile.assigned_archetype

    const okfContext = await this.loadOKFContext(archetype, dayNumber, 'session_content')

    const prompt = this.buildSessionPrompt(profile, dayNumber, archetype, okfContext)

    try {
      const response = await this.callGemini(prompt)
      const content = this.parseSessionResponse(response)

      await this.logPersonalization(userId, dayNumber, 'session_content', archetype, okfContext.docsLoaded)

      return content
    } catch {
      return null // Graceful fallback to static content
    }
  }

  /**
   * Get personalized notification message
   */
  async getPersonalizedNotification(
    userId: string,
    triggerType: NotificationTriggerType,
    dayNumber: number
  ): Promise<NotificationMessage | null> {
    const profile = await behaviorProfileService.getProfile(userId)
    if (!profile) return null

    const archetype = profile.archetype_confidence > 0.75
      ? profile.behavioral_archetype
      : profile.assigned_archetype

    const recentCravings = await this.getRecentCravings(userId)
    const okfContext = await this.loadOKFContext(archetype, dayNumber, 'notification')

    const prompt = this.buildNotificationPrompt(profile, triggerType, dayNumber, archetype, recentCravings, okfContext)

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
   * Get AI explanation for backoffice transparency
   */
  async getPersonalizationRationale(userId: string): Promise<string> {
    const profile = await behaviorProfileService.getProfile(userId)
    if (!profile) return 'No behavioral profile computed yet (user in observation phase or insufficient data).'

    const archetype = profile.archetype_confidence > 0.75
      ? profile.behavioral_archetype
      : profile.assigned_archetype

    return [
      `Learning phase: ${profile.learning_phase} (${profile.days_observed} days observed)`,
      `Assigned archetype: ${profile.assigned_archetype}`,
      `Behavioral archetype: ${profile.behavioral_archetype} (confidence: ${(profile.archetype_confidence * 100).toFixed(0)}%)`,
      `Active archetype: ${archetype}`,
      `Dominant trigger: ${profile.dominant_trigger}`,
      `Intensity trend: ${profile.intensity_trend}`,
      `Mood trend: ${profile.mood_trend}`,
      `Best notification hour: ${profile.best_notification_hour ?? 'unknown'}`,
      `Preferred notification style: ${profile.best_notification_style}`,
      `Notification open rate: ${(profile.notification_open_rate * 100).toFixed(0)}%`,
    ].join('\n')
  }

  // ─── Private Methods ───────────────────────────────────────────────────────

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

  private async loadOKFContext(
    archetype: QuitArchetype,
    dayNumber: number,
    requestType: string
  ): Promise<{ context: string; docsLoaded: string[] }> {
    const docsLoaded: string[] = []
    const sections: string[] = []

    // Always load archetype doc
    const archetypeDoc = this.getArchetypeContext(archetype)
    sections.push(archetypeDoc)
    docsLoaded.push(`archetypes/${archetype}.md`)

    // Load tone guide
    const toneDoc = this.getToneContext(archetype)
    sections.push(toneDoc)
    docsLoaded.push(`content-variants/tone-${archetype.replace('_', '-')}.md`)

    // Load notification rules for notification requests
    if (requestType === 'notification') {
      sections.push(this.getNotificationContext())
      docsLoaded.push('notifications/timing-rules.md', 'notifications/escalation-rules.md')
    }

    // Load program day context
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
      [QuitArchetype.ESCAPIST]: `TONE GUIDE: Warm, curious, gently poetic. Flowing sentences. Nature metaphors. Compassionate, never judgmental. Use em-dashes and questions.`,
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
      3: 'The Pleasure Illusion — Nicotine doesnt create pleasure',
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
      29: 'Your Values & The Life Youre Building',
      30: 'Free for Life — Lifelong non-smoker identity',
    }
    return `PROGRAM DAY ${dayNumber}: ${dayThemes[dayNumber] || 'Unknown'}`
  }

  private buildSessionPrompt(
    profile: UserBehaviorProfile,
    dayNumber: number,
    archetype: QuitArchetype,
    okfContext: { context: string }
  ): string {
    return `You are the personalization engine for Smono, a 30-day CBT-based quit-smoking app.

KNOWLEDGE CONTEXT:
${okfContext.context}

USER BEHAVIORAL PROFILE:
- Archetype: ${archetype}
- Dominant trigger: ${profile.dominant_trigger}
- Intensity trend: ${profile.intensity_trend}
- Mood trend: ${profile.mood_trend}
- Avg session time: ${profile.avg_session_minutes} min
- Days observed: ${profile.days_observed}

TASK: Generate personalized content insertions for Day ${dayNumber}.

RULES:
- Never mention "archetype" or system internals
- Stay within CBT framework
- Non-stigmatizing and trauma-informed
- Second-person, present tense
- Session intro: max 150 words
- Exercise motivation: max 60 words
- Closing reflection: max 100 words
- Journal prompt: max 40 words

Respond with JSON:
{
  "session_intro": "...",
  "exercise_motivation": "...",
  "closing_reflection": "...",
  "journal_prompt": "..."
}`
  }

  private buildNotificationPrompt(
    profile: UserBehaviorProfile,
    triggerType: NotificationTriggerType,
    dayNumber: number,
    archetype: QuitArchetype,
    recentCravings: any[],
    okfContext: { context: string }
  ): string {
    const hasRecentSlip = recentCravings.some(c => c.type === 'slip')

    return `You are the notification engine for Smono, a 30-day CBT quit-smoking app.

KNOWLEDGE CONTEXT:
${okfContext.context}

USER PROFILE:
- Archetype: ${archetype}
- Day: ${dayNumber}
- Trigger type: ${triggerType}
- Recent cravings (48h): ${recentCravings.length}
- Has recent slip: ${hasRecentSlip}
- Intensity trend: ${profile.intensity_trend}
- Mood trend: ${profile.mood_trend}

TASK: Generate ONE notification message for trigger type "${triggerType}".

HARD RULES:
- Title: max 60 characters
- Body: max 120 characters
- NEVER use guilt or shame
- ${hasRecentSlip ? 'SLIP DETECTED: Use only compassionate, zero-guilt framing' : ''}
- Make it actionable — user should know what to do

Respond with JSON:
{
  "title": "...",
  "body": "..."
}`
  }

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

  private parseNotificationResponse(raw: string, triggerType: NotificationTriggerType, archetype: QuitArchetype): NotificationMessage {
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

  private async getRecentCravings(userId: string): Promise<any[]> {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    try {
      return await pb.collection('cravings').getFullList({
        filter: `user="${userId}" && created>="${since}"`,
        sort: '-created',
      })
    } catch { return [] }
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
        ai_response_summary: `Generated ${requestType} for ${archetype} user on day ${dayNumber}`,
      } satisfies Omit<PersonalizationLog, 'id' | 'created' | 'content_fit_score'>)
    } catch { /* non-critical */ }
  }
}

export const aiService = new AIPersonalizationService()
