import { pb } from '../lib/pocketbase'
import { UserBehaviorProfile } from '../types/models'
import { CravingTrigger, QuitArchetype, StepType } from '../types/enums'

/**
 * Computes and manages the user's behavioral profile.
 * Reads raw signals from analytics_events + cravings + journal_entries,
 * computes the profile, and writes it to user_behavior_profiles.
 */
class BehaviorProfileService {

  async getProfile(userId: string): Promise<UserBehaviorProfile | null> {
    try {
      const record = await pb.collection('user_behavior_profiles').getFirstListItem(`user="${userId}"`)
      return record as unknown as UserBehaviorProfile
    } catch {
      return null
    }
  }

  async computeAndSave(userId: string): Promise<UserBehaviorProfile | null> {
    const [events, cravings, journals, sessions, userProfile] = await Promise.all([
      this.getRecentEvents(userId, 5),
      this.getRecentCravings(userId, 5),
      this.getRecentJournals(userId, 5),
      this.getRecentSessions(userId, 5),
      this.getUserProfile(userId),
    ])

    if (!userProfile) return null

    const daysObserved = this.countDaysWithActivity(events)
    const learningPhase = daysObserved >= 5 ? 'active' : 'observing'

    const profile: Partial<UserBehaviorProfile> = {
      user: userId,
      peak_active_hour: this.computePeakHour(events),
      peak_active_hour_2: this.computeSecondPeakHour(events),
      craving_peak_hour: this.computeCravingPeakHour(cravings),
      avg_session_minutes: this.computeAvgSessionMinutes(sessions),
      preferred_step_types: this.computePreferredStepTypes(events),
      typical_dropout_step: this.computeTypicalDropout(events),
      dominant_trigger: this.computeDominantTrigger(cravings),
      avg_craving_intensity: this.computeAvgIntensity(cravings),
      intensity_trend: this.computeIntensityTrend(cravings),
      mood_trend: this.computeMoodTrend(journals),
      assigned_archetype: userProfile.quit_archetype || QuitArchetype.AUTO_PILOT,
      behavioral_archetype: this.inferArchetype(cravings, events),
      archetype_confidence: this.computeArchetypeConfidence(cravings, events),
      best_notification_hour: this.computeBestNotificationHour(events),
      best_notification_style: this.inferNotificationStyle(userProfile.quit_archetype),
      notification_open_rate: await this.computeNotificationOpenRate(userId),
      learning_phase: learningPhase as 'observing' | 'active',
      days_observed: daysObserved,
      last_updated: new Date().toISOString(),
    }

    return await this.upsertProfile(userId, profile)
  }

  // Check if personalization should be active for this user
  async isPersonalizationActive(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId)
    return profile?.learning_phase === 'active'
  }

  // ─── Private Computation Methods ───────────────────────────────────────────

  private async getRecentEvents(userId: string, _days: number) {
    try {
      return await pb.collection('analytics_events').getFullList({
        filter: `user="${userId}"`,
        sort: '-id',
      })
    } catch { return [] }
  }

  private async getRecentCravings(userId: string, _days: number) {
    try {
      return await pb.collection('cravings').getFullList({
        filter: `user="${userId}"`,
        sort: '-id',
      })
    } catch { return [] }
  }

  private async getRecentJournals(userId: string, _days: number) {
    try {
      return await pb.collection('journal_entries').getFullList({
        filter: `user="${userId}"`,
        sort: '-id',
      })
    } catch { return [] }
  }

  private async getRecentSessions(userId: string, _days: number) {
    try {
      return await pb.collection('session_progress').getFullList({
        filter: `user="${userId}"`,
        sort: '-id',
      })
    } catch { return [] }
  }

  private async getUserProfile(userId: string) {
    try {
      return await pb.collection('user_profiles').getFirstListItem(`user="${userId}"`)
    } catch { return null }
  }

  private computePeakHour(events: any[]): number {
    const hours = new Array(24).fill(0)
    events.forEach(e => {
      const h = new Date(e.created).getHours()
      hours[h]++
    })
    return hours.indexOf(Math.max(...hours))
  }

  private computeSecondPeakHour(events: any[]): number {
    const hours = new Array(24).fill(0)
    events.forEach(e => {
      const h = new Date(e.created).getHours()
      hours[h]++
    })
    const peak = hours.indexOf(Math.max(...hours))
    hours[peak] = 0
    return hours.indexOf(Math.max(...hours))
  }

  private computeCravingPeakHour(cravings: any[]): number {
    const hours = new Array(24).fill(0)
    cravings.forEach(c => {
      const h = new Date(c.created).getHours()
      hours[h]++
    })
    return hours.indexOf(Math.max(...hours))
  }

  private computeAvgSessionMinutes(sessions: any[]): number {
    if (sessions.length === 0) return 0
    const total = sessions.reduce((sum: number, s: any) => sum + (s.time_spent_minutes || 0), 0)
    return Math.round(total / sessions.length)
  }

  private computePreferredStepTypes(events: any[]): StepType[] {
    const counts: Record<string, number> = {}
    events.forEach(e => {
      if (e.meta?.step_type) counts[e.meta.step_type] = (counts[e.meta.step_type] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type as StepType)
  }

  private computeTypicalDropout(events: any[]): number {
    const dropoffs = events
      .filter(e => e.event_type === 'behavior_step_dropped')
      .map(e => e.meta?.step_index || 0)
    if (dropoffs.length === 0) return 0
    return Math.round(dropoffs.reduce((a: number, b: number) => a + b, 0) / dropoffs.length)
  }

  private computeDominantTrigger(cravings: any[]): CravingTrigger {
    const counts: Record<string, number> = {}
    cravings.forEach(c => {
      counts[c.trigger] = (counts[c.trigger] || 0) + 1
    })
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a)
    return (sorted[0]?.[0] || 'habit') as CravingTrigger
  }

  private computeAvgIntensity(cravings: any[]): number {
    if (cravings.length === 0) return 0
    return Math.round((cravings.reduce((sum: number, c: any) => sum + (c.intensity || 0), 0) / cravings.length) * 10) / 10
  }

  private computeIntensityTrend(cravings: any[]): 'rising' | 'stable' | 'falling' {
    if (cravings.length < 4) return 'stable'
    const half = Math.floor(cravings.length / 2)
    const recent = cravings.slice(0, half)
    const older = cravings.slice(half)
    const recentAvg = recent.reduce((s: number, c: any) => s + c.intensity, 0) / recent.length
    const olderAvg = older.reduce((s: number, c: any) => s + c.intensity, 0) / older.length
    const diff = recentAvg - olderAvg
    if (diff > 0.5) return 'rising'
    if (diff < -0.5) return 'falling'
    return 'stable'
  }

  private computeMoodTrend(journals: any[]): 'improving' | 'stable' | 'declining' {
    if (journals.length < 3) return 'stable'
    const moodMap: Record<string, number> = { very_happy: 5, happy: 4, neutral: 3, sad: 2, very_sad: 1 }
    const scores = journals.map((j: any) => moodMap[j.mood] || 3)
    const half = Math.floor(scores.length / 2)
    const recentAvg = scores.slice(0, half).reduce((a: number, b: number) => a + b, 0) / half
    const olderAvg = scores.slice(half).reduce((a: number, b: number) => a + b, 0) / (scores.length - half)
    const diff = recentAvg - olderAvg
    if (diff > 0.5) return 'improving'
    if (diff < -0.5) return 'declining'
    return 'stable'
  }

  private inferArchetype(cravings: any[], events: any[]): QuitArchetype {
    const triggerCounts: Record<string, number> = {}
    cravings.forEach(c => {
      triggerCounts[c.trigger] = (triggerCounts[c.trigger] || 0) + 1
    })

    const total = cravings.length || 1
    if ((triggerCounts['stress'] || 0) / total > 0.4) return QuitArchetype.STRESS_REACTOR
    if ((triggerCounts['boredom'] || 0) / total > 0.4) return QuitArchetype.ESCAPIST
    if ((triggerCounts['social'] || 0) / total > 0.4) return QuitArchetype.SOCIAL_MIRROR
    if ((triggerCounts['habit'] || 0) / total > 0.4) return QuitArchetype.AUTO_PILOT

    // Fallback: check timing patterns
    const hours = events.map(e => new Date(e.created).getHours())
    const nightCount = hours.filter(h => h >= 20 || h <= 2).length
    if (nightCount / (hours.length || 1) > 0.5) return QuitArchetype.ESCAPIST

    return QuitArchetype.AUTO_PILOT
  }

  private computeArchetypeConfidence(cravings: any[], _events: any[]): number {
    if (cravings.length < 5) return 0.3
    const triggerCounts: Record<string, number> = {}
    cravings.forEach(c => { triggerCounts[c.trigger] = (triggerCounts[c.trigger] || 0) + 1 })
    const total = cravings.length
    const maxRatio = Math.max(...Object.values(triggerCounts)) / total
    return Math.min(maxRatio + 0.1, 1.0)
  }

  private computeBestNotificationHour(events: any[]): number {
    const openEvents = events.filter(e => e.event_type === 'behavior_notification_opened')
    if (openEvents.length === 0) return 9 // default morning
    const hours = new Array(24).fill(0)
    openEvents.forEach(e => { hours[new Date(e.created).getHours()]++ })
    return hours.indexOf(Math.max(...hours))
  }

  private inferNotificationStyle(archetype?: string): 'motivational' | 'grounding' | 'factual' | 'challenge' {
    switch (archetype) {
      case 'escapist': return 'motivational'
      case 'stress_reactor': return 'grounding'
      case 'social_mirror': return 'motivational'
      case 'auto_pilot': return 'challenge'
      default: return 'factual'
    }
  }

  private async computeNotificationOpenRate(userId: string): Promise<number> {
    try {
      const all = await pb.collection('notification_events').getFullList({
        filter: `user="${userId}"`,
      })
      if (all.length === 0) return 0
      const opened = all.filter((n: any) => n.opened_at)
      return Math.round((opened.length / all.length) * 100) / 100
    } catch { return 0 }
  }

  private countDaysWithActivity(events: any[]): number {
    const days = new Set<string>()
    events.forEach(e => { days.add(new Date(e.created).toISOString().split('T')[0]) })
    return days.size
  }

  private async upsertProfile(userId: string, profile: Partial<UserBehaviorProfile>): Promise<UserBehaviorProfile> {
    try {
      const existing = await pb.collection('user_behavior_profiles').getFirstListItem(`user="${userId}"`)
      const updated = await pb.collection('user_behavior_profiles').update(existing.id, profile)
      return updated as unknown as UserBehaviorProfile
    } catch {
      const created = await pb.collection('user_behavior_profiles').create(profile)
      return created as unknown as UserBehaviorProfile
    }
  }
}

export const behaviorProfileService = new BehaviorProfileService()
