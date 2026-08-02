/**
 * Email channel kill-switch from app_settings.notifications.emailNotificationsEnabled.
 * Independent of push — deactivating email must never stop push.
 */
import { adminAuth, getPbUrl } from './pb-admin.js'

const CACHE_MS = 15_000
let cache = { enabled: true, at: 0 }

/** Invalidate after admin toggles (optional). */
export function clearEmailEnabledCache() {
  cache = { enabled: true, at: 0 }
}

/**
 * @returns {Promise<boolean>} true when outbound product email is allowed
 */
export async function isEmailNotificationsEnabled() {
  if (Date.now() - cache.at < CACHE_MS) return cache.enabled

  try {
    const token = await adminAuth()
    if (!token) {
      // Fail open for SMTP-configured envs if PB briefly unreachable — still require SMTP
      cache = { enabled: true, at: Date.now() }
      return true
    }
    const pb = getPbUrl()
    const filter = encodeURIComponent('key = "global"')
    const res = await fetch(
      `${pb}/api/collections/app_settings/records?filter=${filter}&perPage=1&fields=settings`,
      { headers: { Authorization: token } }
    )
    if (!res.ok) {
      cache = { enabled: true, at: Date.now() }
      return true
    }
    const data = await res.json()
    const notifications = data.items?.[0]?.settings?.notifications
    // Default on if unset
    const enabled = notifications?.emailNotificationsEnabled !== false
    cache = { enabled, at: Date.now() }
    return enabled
  } catch {
    cache = { enabled: true, at: Date.now() }
    return true
  }
}

/**
 * Per-template email gate: type=email && is_active for trigger_event.
 * Missing template → allow (legacy sends that don't use templates).
 */
export async function isEmailTemplateActive(triggerEvent) {
  if (!(await isEmailNotificationsEnabled())) return false
  if (!triggerEvent) return true

  try {
    const token = await adminAuth()
    if (!token) return true
    const pb = getPbUrl()
    const filter = encodeURIComponent(
      `type = "email" && trigger_event = "${String(triggerEvent).replace(/"/g, '')}" && language = "en"`
    )
    const res = await fetch(
      `${pb}/api/collections/notification_templates/records?filter=${filter}&perPage=5&fields=is_active`,
      { headers: { Authorization: token } }
    )
    if (!res.ok) return true
    const data = await res.json()
    const items = data.items || []
    if (!items.length) return true
    return items.some((t) => t.is_active !== false)
  } catch {
    return true
  }
}
