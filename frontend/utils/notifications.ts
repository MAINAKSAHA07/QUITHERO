/**
 * Push Notifications utility
 * Handles browser notification permissions and scheduling
 */

export class NotificationService {
  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  /**
   * Check if notifications are supported and permitted
   */
  static isSupported(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  /**
   * Show a notification
   */
  static showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported()) {
      return null
    }

    try {
      return new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      })
    } catch (error) {
      console.error('Failed to show notification:', error)
      return null
    }
  }

  /**
   * Schedule a daily reminder
   */
  static scheduleDailyReminder(time: string, callback?: () => void): number | null {
    if (!this.isSupported()) {
      return null
    }

    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (reminderTime.getTime() <= now.getTime()) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const msUntilReminder = reminderTime.getTime() - now.getTime()

    const timeoutId = window.setTimeout(() => {
      this.showNotification('Quit Hero', {
        body: 'Time for your daily check-in! How are you feeling today?',
        tag: 'daily-reminder',
        requireInteraction: false,
      })

      if (callback) {
        callback()
      }

      // Schedule next day's reminder
      this.scheduleDailyReminder(time, callback)
    }, msUntilReminder)

    return timeoutId
  }

  /**
   * Cancel a scheduled reminder
   */
  static cancelReminder(timeoutId: number): void {
    clearTimeout(timeoutId)
  }
}

