import { adminAuth, getPbUrl } from './pb-admin.js'
import { isPushReady, notifyUserPush } from './push.js'

const sentToday = new Map()

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function currentHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function startReminderScheduler() {
  if (!isPushReady()) return

  const tick = async () => {
    const token = await adminAuth()
    if (!token) return

    const hhmm = currentHHMM()
    const pb = getPbUrl()
    const filter = encodeURIComponent(`enable_reminders=true && daily_reminder_time="${hhmm}"`)
    const res = await fetch(
      `${pb}/api/collections/user_profiles/records?filter=${filter}&perPage=200&fields=user,daily_reminder_time`,
      { headers: { Authorization: token } }
    ).catch(() => null)

    if (!res?.ok) return
    const data = await res.json()
    const day = todayKey()

    for (const profile of data.items || []) {
      const userId = typeof profile.user === 'string' ? profile.user : profile.user?.id
      if (!userId) continue
      const dedupe = `${userId}:${day}`
      if (sentToday.get(dedupe)) continue
      sentToday.set(dedupe, true)

      const sent = await notifyUserPush(userId, {
        title: 'smono',
        body: 'Time for your daily check-in. How are you feeling today?',
        url: '/home',
        tag: 'daily-reminder',
      })
      if (sent > 0) {
        console.log(`[Reminder] Sent daily push to user ${userId.slice(0, 8)}…`)
      }
    }

    if (sentToday.size > 5000) sentToday.clear()
  }

  setInterval(tick, 60_000)
  setTimeout(tick, 5000)
  console.log('[Reminder] Scheduler started (checks every minute)')
}
