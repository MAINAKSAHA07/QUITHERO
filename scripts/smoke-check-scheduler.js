import { adminAuth, getPbUrl } from './pb-admin.js'
import { isPushReady, notifyUserPush } from './push.js'

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const sentForPeriod = new Map()

function parseQuitDay(raw) {
  const m = String(raw || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isPastQuitDay(quitDateRaw, now = new Date()) {
  const quit = parseQuitDay(quitDateRaw)
  if (!quit) return false
  return startOfDay(now).getTime() >= quit.getTime()
}

function anchorAt(quitDateRaw, lastRespondedAt) {
  if (lastRespondedAt) {
    const t = new Date(lastRespondedAt)
    if (!Number.isNaN(t.getTime())) return t
  }
  const quit = parseQuitDay(quitDateRaw)
  return quit ? startOfDay(quit) : null
}

function isDue(quitDateRaw, lastRespondedAt, now = new Date()) {
  if (!isPastQuitDay(quitDateRaw, now)) return false
  const anchor = anchorAt(quitDateRaw, lastRespondedAt)
  if (!anchor) return false
  return now.getTime() - anchor.getTime() >= SIX_HOURS_MS
}

function periodKey(userId, anchor) {
  return `${userId}:${Math.floor(anchor.getTime() / SIX_HOURS_MS)}`
}

async function lastCheckIn(token, userId) {
  const pb = getPbUrl()
  const filter = encodeURIComponent(`user="${userId}"`)
  const res = await fetch(
    `${pb}/api/collections/smoke_check_ins/records?filter=${filter}&sort=-responded_at&perPage=1`,
    { headers: { Authorization: token } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] || null
}

export function startSmokeCheckScheduler() {
  const tick = async () => {
    if (!isPushReady()) return
    const token = await adminAuth()
    if (!token) return

    const pb = getPbUrl()
    const filter = encodeURIComponent('enable_reminders=true')
    const res = await fetch(
      `${pb}/api/collections/user_profiles/records?filter=${filter}&perPage=200&fields=user,quit_date`,
      { headers: { Authorization: token } }
    ).catch(() => null)
    if (!res?.ok) return

    const data = await res.json()
    const now = new Date()

    for (const profile of data.items || []) {
      const userId = typeof profile.user === 'string' ? profile.user : profile.user?.id
      if (!userId || !profile.quit_date) continue
      if (!isPastQuitDay(profile.quit_date, now)) continue

      const last = await lastCheckIn(token, userId)
      const lastAt = last?.responded_at || null
      if (!isDue(profile.quit_date, lastAt, now)) continue

      const anchor = anchorAt(profile.quit_date, lastAt)
      const key = periodKey(userId, anchor)
      if (sentForPeriod.get(key)) continue
      sentForPeriod.set(key, true)

      const sent = await notifyUserPush(userId, {
        title: 'Quick smoke check-in',
        body: 'Did you stay smoke-free since your last check-in? Tap to answer — it only takes a second.',
        url: '/home?smoke_check=1',
        tag: `smoke-check-${key}`,
      })
      if (sent > 0) {
        console.log(`[SmokeCheck] Push sent to ${userId.slice(0, 8)}…`)
      }
    }
  }

  tick().catch(() => {})
  setInterval(() => tick().catch(() => {}), 5 * 60 * 1000)
}
