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
      // Analytics failures should not break the app
      console.warn('Analytics tracking failed:', error)
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
}

export const analyticsService = new AnalyticsService()

