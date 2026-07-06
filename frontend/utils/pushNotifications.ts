import { pb } from '../lib/pocketbase'
import { NotificationService } from './notifications'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

async function parseJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export async function enablePushNotifications(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { ok: false, error: 'Push not supported on this device.' }
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission denied.' }
  }

  const keyRes = await fetch('/api/push/vapid-public-key')
  const keyData = await parseJson(keyRes)
  if (!keyRes.ok || !keyData.publicKey) {
    return { ok: false, error: 'Push not configured on server yet.' }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
    })
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  })

  const data = await parseJson(res)
  if (!res.ok) {
    return { ok: false, error: data.error || 'Failed to register for push.' }
  }
  return { ok: true }
}

export async function syncPushSubscriptionIfGranted(): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return { ok: false, skipped: true }
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return enablePushNotifications()

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    })
    if (!res.ok) return { ok: false }
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export async function enablePushWithFeedback() {
  const result = await enablePushNotifications()
  if (result.ok) {
    NotificationService.triggerNativeNotification(
      'Notifications enabled',
      'Daily reminders will reach you even when smono is closed.'
    )
  }
  return result
}
