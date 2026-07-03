import { pb } from '../lib/pocketbase'
import { BehaviorSignal } from '../types/models'

const FLUSH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_BUFFER_SIZE = 20

class BehaviorTrackerService {
  private buffer: BehaviorSignal[] = []
  private flushTimer: number | null = null
  private userId: string | null = null

  init(userId: string) {
    this.userId = userId
    this.startFlushTimer()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush()
    })
  }

  record(signal: BehaviorSignal) {
    if (!this.userId) return
    this.buffer.push({ ...signal, timestamp: signal.timestamp || new Date().toISOString() })
    if (this.buffer.length >= MAX_BUFFER_SIZE) this.flush()
  }

  async flush(): Promise<void> {
    if (!this.userId || this.buffer.length === 0) return

    const signals = [...this.buffer]
    this.buffer = []

    try {
      for (const signal of signals) {
        await pb.collection('analytics_events').create({
          user: this.userId,
          event_type: `behavior_${signal.type}`,
          meta: signal.meta,
        })
      }
    } catch {
      // Re-queue failed signals for next flush
      this.buffer.unshift(...signals)
    }
  }

  // Convenience methods for common signals
  trackPageView(page: string) {
    this.record({
      type: 'page_view',
      timestamp: new Date().toISOString(),
      meta: { page, hour: new Date().getHours() },
    })
  }

  trackSessionComplete(dayNumber: number, timeSpentMinutes: number, stepsCompleted: number, totalSteps: number) {
    this.record({
      type: 'session_complete',
      timestamp: new Date().toISOString(),
      meta: { day_number: dayNumber, time_spent_minutes: timeSpentMinutes, steps_completed: stepsCompleted, total_steps: totalSteps },
    })
  }

  trackCravingLogged(trigger: string, intensity: number, type: string) {
    this.record({
      type: type === 'slip' ? 'slip' : 'craving_logged',
      timestamp: new Date().toISOString(),
      meta: { trigger, intensity, craving_type: type, hour: new Date().getHours() },
    })
  }

  trackStepDropped(dayNumber: number, stepIndex: number, stepType: string) {
    this.record({
      type: 'step_dropped',
      timestamp: new Date().toISOString(),
      meta: { day_number: dayNumber, step_index: stepIndex, step_type: stepType },
    })
  }

  trackNotificationOpened(notificationId: string, triggerType: string) {
    this.record({
      type: 'notification_opened',
      timestamp: new Date().toISOString(),
      meta: { notification_id: notificationId, trigger_type: triggerType },
    })
  }

  trackJournalEntry(mood: string) {
    this.record({
      type: 'journal_entry',
      timestamp: new Date().toISOString(),
      meta: { mood, hour: new Date().getHours() },
    })
  }

  destroy() {
    this.flush()
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.userId = null
  }

  private startFlushTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.flushTimer = window.setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
  }
}

export const behaviorTracker = new BehaviorTrackerService()
