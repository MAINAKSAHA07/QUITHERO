import { pb } from '../lib/pocketbase'
import { NotificationTriggerType, UserBehaviorProfile } from '../types/models'
import { QuitArchetype } from '../types/enums'
import { aiService } from './ai.service'
import { behaviorProfileService } from './behavior-profile.service'
import { NotificationService } from '../utils/notifications'

const COOLDOWN_MS = 2 * 60 * 60 * 1000 // 2 hours between notifications
const MAX_DAILY = 3
const NIGHT_START = 23
const NIGHT_END = 7

/**
 * AI-powered notification scheduler.
 * Replaces the flat scheduleDailyReminder with intelligent, 
 * archetype-aware, behaviorally-timed notifications.
 */
class AINotificationScheduler {
  private scheduledTimer: number | null = null
  private userId: string | null = null
  private dayNumber: number = 1
  private lastSentAt: number = 0
  private sentToday: number = 0
  private lastResetDate: string = ''

  async init(userId: string, dayNumber: number) {
    this.userId = userId
    this.dayNumber = dayNumber
    this.resetDailyCount()

    const profile = await behaviorProfileService.getProfile(userId)
    const sendHour = profile?.best_notification_hour ?? this.getDefaultHour(profile)

    this.scheduleAt(sendHour)
  }

  /**
   * Trigger a craving-spike notification (called when ≥2 cravings in 2h or intensity 5)
   */
  async triggerCravingSpike(userId: string): Promise<void> {
    if (!this.canSend()) return
    await this.sendNotification(userId, 'craving_spike')
  }

  /**
   * Trigger a missed-session notification
   */
  async triggerMissedSession(userId: string): Promise<void> {
    if (!this.canSend()) return
    await this.sendNotification(userId, 'missed_session')
  }

  /**
   * Trigger slip recovery notification (highest priority)
   */
  async triggerSlipRecovery(userId: string): Promise<void> {
    // Slip overrides cooldown (but not night silence)
    if (this.isNightHours()) return
    await this.sendNotification(userId, 'slip')
  }

  destroy() {
    if (this.scheduledTimer) clearTimeout(this.scheduledTimer)
    this.userId = null
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async sendNotification(userId: string, triggerType: NotificationTriggerType) {
    const message = await aiService.getPersonalizedNotification(userId, triggerType, this.dayNumber)

    if (!message) {
      // Fallback to static message
      this.sendStaticFallback(triggerType)
      return
    }

    NotificationService.showNotification(message.title, { body: message.body, tag: `smono-${triggerType}` })

    this.lastSentAt = Date.now()
    this.sentToday++

    // Log to PocketBase
    await this.logNotificationEvent(userId, message, triggerType)
  }

  private sendStaticFallback(triggerType: NotificationTriggerType) {
    const fallbacks: Record<NotificationTriggerType, { title: string; body: string }> = {
      scheduled: { title: 'smono', body: 'Your daily session is ready. A few minutes of clarity.' },
      craving_spike: { title: 'Breathe', body: 'The craving peaks at 3 minutes. You are already in it.' },
      missed_session: { title: 'Still here', body: 'Today\'s session is waiting. Even 5 minutes counts.' },
      slip: { title: 'Still on the path', body: 'One slip doesn\'t undo your progress. Come back when ready.' },
    }
    const msg = fallbacks[triggerType]
    NotificationService.showNotification(msg.title, { body: msg.body, tag: `smono-${triggerType}` })
    this.lastSentAt = Date.now()
    this.sentToday++
  }

  private async logNotificationEvent(userId: string, message: any, triggerType: NotificationTriggerType) {
    try {
      await pb.collection('notification_events').create({
        user: userId,
        trigger_type: triggerType,
        message_title: message.title,
        message_body: message.body,
        archetype_at_send: message.archetype || 'auto_pilot',
        day_number: this.dayNumber,
        sent_at: new Date().toISOString(),
        led_to_session: false,
      })
    } catch { /* non-critical */ }
  }

  private scheduleAt(hour: number) {
    if (this.scheduledTimer) clearTimeout(this.scheduledTimer)

    const now = new Date()
    const target = new Date()
    target.setHours(hour, 0, 0, 0)

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1)
    }

    const ms = target.getTime() - now.getTime()
    this.scheduledTimer = window.setTimeout(async () => {
      if (this.userId && this.canSend()) {
        await this.sendNotification(this.userId, 'scheduled')
      }
      // Reschedule for next day
      this.scheduleAt(hour)
    }, ms)
  }

  private canSend(): boolean {
    this.resetDailyCount()
    if (this.sentToday >= MAX_DAILY) return false
    if (Date.now() - this.lastSentAt < COOLDOWN_MS) return false
    if (this.isNightHours()) return false
    return true
  }

  private isNightHours(): boolean {
    const hour = new Date().getHours()
    return hour >= NIGHT_START || hour < NIGHT_END
  }

  private getDefaultHour(profile: UserBehaviorProfile | null): number {
    if (!profile) return 9
    // Use archetype-based defaults
    switch (profile.assigned_archetype) {
      case QuitArchetype.ESCAPIST: return 19
      case QuitArchetype.STRESS_REACTOR: return 9
      case QuitArchetype.SOCIAL_MIRROR: return 17
      case QuitArchetype.AUTO_PILOT: return 8
      default: return 9
    }
  }

  private resetDailyCount() {
    const today = new Date().toISOString().split('T')[0]
    if (today !== this.lastResetDate) {
      this.sentToday = 0
      this.lastResetDate = today
    }
  }
}

export const aiNotificationScheduler = new AINotificationScheduler()
