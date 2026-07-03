import { BaseService } from './base.service'
import { AnalyticsEvent } from '../types/models'
import { ApiResponse } from '../types/api'

export class AnalyticsService extends BaseService {
  constructor() {
    super('analytics_events')
  }

  /**
   * Track an event
   */
  async trackEvent(
    eventType: string,
    meta?: Record<string, any>,
    userId?: string
  ): Promise<ApiResponse<AnalyticsEvent>> {
    try {
      const event = await this.create({
        event_type: eventType,
        meta: meta || {},
        ...(userId && { user: userId }),
      })
      return event
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, userId?: string): Promise<void> {
    await this.trackEvent('page_view', { page }, userId)
  }

  /**
   * Track user registration
   */
  async trackUserRegistered(userId: string): Promise<void> {
    await this.trackEvent('user_registered', {}, userId)
  }

  /**
   * Track login
   */
  async trackLogin(userId: string): Promise<void> {
    await this.trackEvent('login', {}, userId)
  }

  /**
   * Track logout
   */
  async trackLogout(userId: string): Promise<void> {
    await this.trackEvent('logout', {}, userId)
  }

  /**
   * Track onboarding completion
   */
  async trackOnboardingCompleted(userId: string): Promise<void> {
    await this.trackEvent('onboarding_completed', {}, userId)
  }

  /**
   * Track session started
   */
  async trackSessionStarted(userId: string, day: number): Promise<void> {
    await this.trackEvent('session_started', { day }, userId)
  }

  /**
   * Track session completed
   */
  async trackSessionCompleted(userId: string, day: number, timeSpentMinutes: number): Promise<void> {
    await this.trackEvent('session_completed', { day, time_spent_minutes: timeSpentMinutes }, userId)
  }

  /**
   * Track craving logged
   */
  async trackCravingLogged(userId: string, type: string, trigger: string): Promise<void> {
    await this.trackEvent('craving_logged', { type, trigger }, userId)
  }

  /**
   * Track achievement unlocked
   */
  async trackAchievementUnlocked(userId: string, achievementKey: string): Promise<void> {
    await this.trackEvent('achievement_unlocked', { achievement_key: achievementKey }, userId)
  }

  /**
   * Track journal entry created
   */
  async trackJournalEntryCreated(userId: string): Promise<void> {
    await this.trackEvent('journal_entry_created', {}, userId)
  }

  /**
   * Track profile updated
   */
  async trackProfileUpdated(userId: string): Promise<void> {
    await this.trackEvent('profile_updated', {}, userId)
  }

  // ─── OKF Behavioral AI Events ─────────────────────────────────────────────

  async trackNotificationSent(userId: string, triggerType: string, messageTitle: string): Promise<void> {
    await this.trackEvent('notification_sent', { trigger_type: triggerType, message_title: messageTitle }, userId)
  }

  async trackNotificationOpened(userId: string, notificationId: string, triggerType: string): Promise<void> {
    await this.trackEvent('notification_opened', { notification_id: notificationId, trigger_type: triggerType }, userId)
  }

  async trackStepDropped(userId: string, dayNumber: number, stepIndex: number, stepType: string): Promise<void> {
    await this.trackEvent('step_dropped', { day_number: dayNumber, step_index: stepIndex, step_type: stepType }, userId)
  }

  async trackArchetypeRevised(userId: string, from: string, to: string, confidence: number): Promise<void> {
    await this.trackEvent('archetype_revised', { from_archetype: from, to_archetype: to, confidence }, userId)
  }

  async trackBehaviorProfileUpdated(userId: string, phase: string): Promise<void> {
    await this.trackEvent('behavior_profile_updated', { learning_phase: phase }, userId)
  }

  async trackPersonalizationServed(userId: string, dayNumber: number, archetype: string): Promise<void> {
    await this.trackEvent('personalization_served', { day_number: dayNumber, archetype }, userId)
  }
}

export const analyticsService = new AnalyticsService()

