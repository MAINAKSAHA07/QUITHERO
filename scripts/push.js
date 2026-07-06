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
    user: userId || '',
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
  if (!pushReady || !userId) return 0
  const records = await loadSubscriptionsForUser(userId)
  let sent = 0
  const payload = { title, message: body, body, url, tag: tag || 'smono' }

  for (const record of records) {
    const sub = record.subscription
    if (!sub?.endpoint) continue
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload))
      sent += 1
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await removePushSubscription(sub.endpoint)
      }
    }
  }
  return sent
}
