import { adminAuth, getPbUrl } from './pb-admin.js'
import { isPushReady, notifyUserPush } from './push.js'
import { getDailyQuoteText } from './daily-quote.js'

const sentToday = new Map()

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

const PREF_TO_TIME = {
  'Morning: 8 AM to 10 AM': '09:00',
  'Lunchtime: 12 PM to 2 PM': '13:00',
  'Evening: 6 PM to 8 PM': '19:00',
  'Bedtime: 9 PM to 11 PM': '22:00',
}

function reminderTimeForProfile(profile) {
  if (profile.daily_reminder_time) return profile.daily_reminder_time
  if (profile.checkin_time_preference) {
    return PREF_TO_TIME[profile.checkin_time_preference] || '09:00'
  }
  return '09:00'
}

function localHHMM(timezone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date())
    const h = parts.find((p) => p.type === 'hour')?.value ?? '00'
    const m = parts.find((p) => p.type === 'minute')?.value ?? '00'
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  } catch {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
}

/** Title from reminder HH:MM — was hardcoded "Good morning" for evening slots too. */
function reminderTitle(timeHHMM) {
  const h = parseInt(String(timeHHMM).split(':')[0], 10)
  if (!Number.isFinite(h)) return 'Your daily quote'
  if (h < 12) return 'Good morning ☀️'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function startReminderScheduler() {
  if (!isPushReady()) return

  const tick = async () => {
    const token = await adminAuth()
    if (!token) return

    const pb = getPbUrl()
    const filter = encodeURIComponent('enable_reminders=true')
    const res = await fetch(
      `${pb}/api/collections/user_profiles/records?filter=${filter}&perPage=200&fields=user,daily_reminder_time,timezone,checkin_time_preference,language`,
      { headers: { Authorization: token } }
    ).catch(() => null)

    if (!res?.ok) return
    const data = await res.json()
    const day = todayKey()

    for (const profile of data.items || []) {
      const userId = typeof profile.user === 'string' ? profile.user : profile.user?.id
      const reminderTime = reminderTimeForProfile(profile)
      if (!userId || !reminderTime) continue

      const userLocal = localHHMM(profile.timezone || 'UTC')
      if (userLocal !== reminderTime) continue

      const dedupe = `${userId}:${day}`
      if (sentToday.get(dedupe)) continue
      sentToday.set(dedupe, true)

      const quoteBody = await getDailyQuoteText(token, profile.language || 'en')
      const result = await notifyUserPush(userId, {
        title: reminderTitle(reminderTime),
        body: quoteBody,
        url: '/home',
        tag: `daily-quote-${day}`,
      })
      if (result.sent > 0) {
        console.log(`[Reminder] Sent quote to ${userId.slice(0, 8)}… (${profile.timezone || 'UTC'} @ ${reminderTime})`)
      }
    }

    if (sentToday.size > 5000) {
      for (const [key] of sentToday.entries()) {
        if (!key.endsWith(`:${day}`)) {
          sentToday.delete(key)
        }
      }
    }
  }

  setInterval(tick, 60_000)
  setTimeout(tick, 5000)
  console.log('[Reminder] Scheduler started (timezone-aware, checks every minute)')
}
