import webpush from 'web-push'
import { adminAuth, getPbUrl } from './pb-admin.js'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@smono.app'

let pushReady = false

export function getVapidPublicKey() {
  return VAPID_PUBLIC || null
}

export function initWebPush() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[Push] VAPID keys not set — background push disabled')
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  pushReady = true
  console.log('[Push] Web Push ready')
  return true
}

export function isPushReady() {
  return pushReady
}

async function upsertSubscription({ endpoint, subscription, userId }) {
  const token = await adminAuth()
  if (!token) throw new Error('PocketBase admin not configured')

  const pb = getPbUrl()
  const filter = encodeURIComponent(`endpoint="${endpoint.replace(/"/g, '\\"')}"`)
  const search = await fetch(`${pb}/api/collections/push_subscriptions/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: token },
  })

  const payload = {
    endpoint,
    subscription,
    user: userId,
    active: true,
  }

  if (search.ok) {
    const data = await search.json()
    const existing = data.items?.[0]
    if (existing) {
      const patch = await fetch(`${pb}/api/collections/push_subscriptions/records/${existing.id}`, {
        method: 'PATCH',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!patch.ok) throw new Error('Failed to update push subscription')
      return patch.json()
    }
  }

  const create = await fetch(`${pb}/api/collections/push_subscriptions/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!create.ok) throw new Error('Failed to save push subscription')
  return create.json()
}

export async function savePushSubscription({ subscription, userId }) {
  if (!subscription?.endpoint) throw new Error('Invalid push subscription')
  if (!userId) throw new Error('userId required')
  return upsertSubscription({ endpoint: subscription.endpoint, subscription, userId })
}

export async function removePushSubscription(endpoint) {
  if (!endpoint) return
  const token = await adminAuth()
  if (!token) return
  const pb = getPbUrl()
  const filter = encodeURIComponent(`endpoint="${endpoint.replace(/"/g, '\\"')}"`)
  const search = await fetch(`${pb}/api/collections/push_subscriptions/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: token },
  })
  if (!search.ok) return
  const data = await search.json()
  const existing = data.items?.[0]
  if (!existing) return
  await fetch(`${pb}/api/collections/push_subscriptions/records/${existing.id}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  })
}

async function loadSubscriptionsForUser(userId) {
  const token = await adminAuth()
  if (!token || !userId) return []
  const pb = getPbUrl()
  const filter = encodeURIComponent(`active=true && user="${userId}"`)
  const res = await fetch(`${pb}/api/collections/push_subscriptions/records?filter=${filter}&perPage=100`, {
    headers: { Authorization: token },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.items || []
}

export async function notifyUserPush(userId, { title, body, url = '/home', tag }) {
  if (!userId) return { sent: 0, attempted: 0, error: 'push_not_ready' }

  const payload = { title, message: body, body, url, tag: tag || 'smono' }
  let sent = 0
  let attempted = 0
  let lastError = null

  if (pushReady) {
    const records = await loadSubscriptionsForUser(userId)
    attempted += records.length
    for (const record of records) {
      const sub = record.subscription
      if (!sub?.endpoint) continue
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload))
        sent += 1
      } catch (err) {
        lastError = err.body || err.message || String(err.statusCode || 'send_failed')
        console.warn(
          `[Push] send failed user=${userId.slice(0, 8)}… status=${err.statusCode || '?'} ${lastError}`
        )
        if (err.statusCode === 404 || err.statusCode === 410) {
          await removePushSubscription(sub.endpoint)
        }
      }
    }
  }

  // Native FCM/APNs — best-effort when configured; never breaks web push
  const native = await sendNativeDevicePushes(userId, payload).catch((err) => {
    console.warn('[Push] native send skipped', err?.message || err)
    return { sent: 0, attempted: 0 }
  })
  sent += native.sent
  attempted += native.attempted

  if (sent === 0) {
    if (!pushReady && native.attempted === 0) {
      return { sent: 0, attempted: 0, error: 'push_not_ready' }
    }
    if (attempted === 0) {
      console.warn(`[Push] No subscriptions for user ${userId.slice(0, 8)}…`)
      return { sent: 0, attempted: 0, error: 'no_subscriptions' }
    }
    return { sent: 0, attempted, error: lastError || 'send_failed' }
  }
  return { sent, attempted }
}

async function loadDeviceTokensForUser(userId) {
  const token = await adminAuth()
  if (!token || !userId) return []
  const pb = getPbUrl()
  const filter = encodeURIComponent(`active=true && user="${userId}"`)
  const res = await fetch(`${pb}/api/collections/device_tokens/records?filter=${filter}&perPage=100`, {
    headers: { Authorization: token },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.items || []
}

export async function saveDeviceToken({ token: deviceToken, platform, userId }) {
  if (!deviceToken || !userId) throw new Error('token and userId required')
  if (platform !== 'ios' && platform !== 'android') throw new Error('platform must be ios or android')

  const admin = await adminAuth()
  if (!admin) throw new Error('PocketBase admin not configured')
  const pb = getPbUrl()
  const filter = encodeURIComponent(`token="${String(deviceToken).replace(/"/g, '')}"`)
  const search = await fetch(`${pb}/api/collections/device_tokens/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: admin },
  })
  const payload = { token: deviceToken, platform, user: userId, active: true }
  if (search.ok) {
    const data = await search.json()
    const existing = data.items?.[0]
    if (existing) {
      const patch = await fetch(`${pb}/api/collections/device_tokens/records/${existing.id}`, {
        method: 'PATCH',
        headers: { Authorization: admin, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!patch.ok) throw new Error('Failed to update device token')
      return patch.json()
    }
  }
  const create = await fetch(`${pb}/api/collections/device_tokens/records`, {
    method: 'POST',
    headers: { Authorization: admin, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!create.ok) throw new Error('Failed to save device token')
  return create.json()
}

export async function removeDeviceToken(deviceToken) {
  if (!deviceToken) return
  const admin = await adminAuth()
  if (!admin) return
  const pb = getPbUrl()
  const filter = encodeURIComponent(`token="${String(deviceToken).replace(/"/g, '')}"`)
  const search = await fetch(`${pb}/api/collections/device_tokens/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: admin },
  })
  if (!search.ok) return
  const data = await search.json()
  const existing = data.items?.[0]
  if (!existing) return
  await fetch(`${pb}/api/collections/device_tokens/records/${existing.id}`, {
    method: 'DELETE',
    headers: { Authorization: admin },
  })
}

/** FCM legacy server key or HTTP v1 — skip silently if unset (web push unchanged). */
async function sendNativeDevicePushes(userId, payload) {
  const fcmKey = process.env.FCM_SERVER_KEY
  const records = await loadDeviceTokensForUser(userId)
  if (!records.length) return { sent: 0, attempted: 0 }
  if (!fcmKey) {
    // Tokens stored; delivery waits until FCM_SERVER_KEY is set
    return { sent: 0, attempted: records.length }
  }

  let sent = 0
  for (const record of records) {
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${fcmKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: record.token,
          notification: { title: payload.title, body: payload.body },
          data: { url: payload.url || '/home', tag: payload.tag || 'smono' },
        }),
      })
      if (res.ok) sent += 1
      else if (res.status === 404 || res.status === 410) {
        await removeDeviceToken(record.token)
      }
    } catch (err) {
      console.warn('[Push] FCM send failed', err?.message || err)
    }
  }
  return { sent, attempted: records.length }
}
