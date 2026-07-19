/**
 * Browser notifications — foreground reminders + SW-backed alerts (PWA / iOS standalone).
 */

const REMINDER_STORAGE_KEY = 'smono_next_reminder'
const DEFAULT_REMINDER_BODY = 'Start your smoke-free day with intention.'
let activeReminderTimeout: number | null = null

export type ReminderBodySource = string | (() => string | Promise<string>)

async function resolveReminderBody(source?: ReminderBodySource): Promise<string> {
  if (typeof source === 'function') {
    try {
      const text = await source()
      if (text?.trim()) return text.trim()
    } catch {
      /* fall through */
    }
    return DEFAULT_REMINDER_BODY
  }
  return source?.trim() || DEFAULT_REMINDER_BODY
}

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return false
    }
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    return (await Notification.requestPermission()) === 'granted'
  }

  static isSupported(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  /** Show via service worker when available (required for iOS PWA background alerts). */
  static triggerNativeNotification(
    title: string,
    body: string,
    url = '/',
    extra?: { tag?: string; eventId?: string; triggerType?: string }
  ) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const data = {
      url,
      eventId: extra?.eventId,
      triggerType: extra?.triggerType,
    }

    const fallback = () => {
      try {
        const n = new Notification(title, {
          body,
          icon: '/mascot.png',
          tag: extra?.tag || 'smono-alert',
          data,
        })
        n.onclick = () => {
          window.focus()
          if (extra?.eventId) {
            window.dispatchEvent(
              new CustomEvent('smono_notification_opened', {
                detail: { eventId: extra.eventId, triggerType: extra.triggerType },
              })
            )
          }
          window.location.href = url
        }
      } catch (e) {
        console.error('Notification failed:', e)
      }
    }

    if ('serviceWorker' in navigator) {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('sw timeout')), 600)
      )
      Promise.race([navigator.serviceWorker.ready, timeout])
        .then((reg) =>
          reg.showNotification(title, {
            body,
            icon: '/mascot.png',
            badge: '/mascot.png',
            tag: extra?.tag || 'smono-alert',
            data,
          })
        )
        .catch(() => fallback())
    } else {
      fallback()
    }
  }

  static showNotification(title: string, options?: NotificationOptions) {
    if (!this.isSupported()) return null
    const data = (options?.data || {}) as {
      url?: string
      eventId?: string
      triggerType?: string
    }
    this.triggerNativeNotification(title, options?.body || '', data.url || '/home', {
      tag: options?.tag,
      eventId: data.eventId,
      triggerType: data.triggerType,
    })
    return null
  }

  /**
   * Schedule morning reminder. Pass a body provider so each day can pick a fresh quote
   * (a fixed string would repeat forever when we reschedule).
   */
  static scheduleDailyReminder(
    time: string,
    body?: ReminderBodySource,
    callback?: () => void
  ): number | null {
    if (!this.isSupported()) return null

    if (activeReminderTimeout) {
      clearTimeout(activeReminderTimeout)
      activeReminderTimeout = null
    }

    const [hours, minutes] = time.split(':').map(Number)
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)
    if (reminderTime.getTime() <= Date.now()) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify({ time, nextAt: reminderTime.getTime() })
    )

    const msUntil = reminderTime.getTime() - Date.now()
    activeReminderTimeout = window.setTimeout(() => {
      void (async () => {
        const message = await resolveReminderBody(body)
        const day = new Date().toISOString().slice(0, 10)
        this.triggerNativeNotification('Good morning ☀️', message, '/home', {
          tag: `daily-quote-${day}`,
        })
        callback?.()
        // Re-schedule with the same provider so tomorrow gets a new quote
        this.scheduleDailyReminder(time, body, callback)
      })()
    }, msUntil)

    return activeReminderTimeout
  }

  /** Fire missed reminder if user opens app after scheduled time — always refresh body. */
  static async checkDueReminder(body?: ReminderBodySource) {
    try {
      const raw = localStorage.getItem(REMINDER_STORAGE_KEY)
      if (!raw || !this.isSupported()) return
      const { time, nextAt } = JSON.parse(raw) as {
        time: string
        nextAt: number
      }
      if (Date.now() >= nextAt) {
        const message = await resolveReminderBody(body)
        const day = new Date().toISOString().slice(0, 10)
        this.triggerNativeNotification('Good morning ☀️', message, '/home', {
          tag: `daily-quote-${day}`,
        })
        this.scheduleDailyReminder(time, body)
      }
    } catch {
      /* ignore */
    }
  }

  static cancelReminder(timeoutId: number): void {
    clearTimeout(timeoutId)
    if (activeReminderTimeout === timeoutId) activeReminderTimeout = null
  }
}
