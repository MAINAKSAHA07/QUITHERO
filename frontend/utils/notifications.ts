/**
 * Browser notifications — foreground reminders + SW-backed alerts (PWA / iOS standalone).
 */

const REMINDER_STORAGE_KEY = 'smono_next_reminder'
let activeReminderTimeout: number | null = null

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

  static scheduleDailyReminder(time: string, body?: string, callback?: () => void): number | null {
    if (!this.isSupported()) return null

    if (activeReminderTimeout) {
      clearTimeout(activeReminderTimeout)
      activeReminderTimeout = null
    }

    const message =
      body?.trim() ||
      'Start your smoke-free day with intention.'

    const [hours, minutes] = time.split(':').map(Number)
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)
    if (reminderTime.getTime() <= Date.now()) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify({ time, body: message, nextAt: reminderTime.getTime() })
    )

    const msUntil = reminderTime.getTime() - Date.now()
    activeReminderTimeout = window.setTimeout(() => {
      this.triggerNativeNotification('Good morning ☀️', message, '/home')
      callback?.()
      this.scheduleDailyReminder(time, message, callback)
    }, msUntil)

    return activeReminderTimeout
  }

  /** Fire missed reminder if user opens app after scheduled time. */
  static checkDueReminder() {
    try {
      const raw = localStorage.getItem(REMINDER_STORAGE_KEY)
      if (!raw || !this.isSupported()) return
      const { time, body, nextAt } = JSON.parse(raw) as {
        time: string
        body?: string
        nextAt: number
      }
      if (Date.now() >= nextAt) {
        this.triggerNativeNotification(
          'Good morning ☀️',
          body || 'Start your smoke-free day with intention.',
          '/home'
        )
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
