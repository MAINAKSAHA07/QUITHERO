import { pb } from '../lib/pocketbase'
import { NotificationService } from './notifications'

function parseJson(res: Response) {
  return res.json().catch(() => ({}))
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** Wait for SW registration — push cannot work without it when the app is closed. */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker not supported on this device.')
  }
  let reg = await navigator.serviceWorker.getRegistration('/')
  if (!reg && import.meta.env.PROD) {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  }
  if (!reg) {
    throw new Error('Service worker not registered. Open the installed app or refresh once.')
  }
  return navigator.serviceWorker.ready
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (pb.authStore.token) {
    headers.Authorization = pb.authStore.token
  }
  return headers
}

async function ensureFreshAuth(): Promise<boolean> {
  if (!pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh()
    } catch {
      return false
    }
  }
  return Boolean(pb.authStore.model?.id)
}

async function postSubscription(subscription: PushSubscriptionJSON) {
  const ok = await ensureFreshAuth()
  if (!ok) {
    return { ok: false as const, error: 'Sign in again to enable background notifications.' }
  }
  const userId = pb.authStore.model!.id

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ subscription, userId }),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    return { ok: false as const, error: (data as { error?: string }).error || 'Failed to register for push.' }
  }
  return { ok: true as const }
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

  if (!pb.authStore.isValid && !(await ensureFreshAuth())) {
    return { ok: false, error: 'Sign in to enable background notifications.' }
  }

  const keyRes = await fetch('/api/push/vapid-public-key')
  const keyData = await parseJson(keyRes)
  if (!keyRes.ok || !(keyData as { publicKey?: string }).publicKey) {
    return { ok: false, error: 'Push not configured on server yet.' }
  }

  const registration = await ensureServiceWorker()
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array((keyData as { publicKey: string }).publicKey),
    })
  }

  return postSubscription(subscription.toJSON())
}

/** Re-link this device's push endpoint to the logged-in user (call after every login). */
export async function ensureServerPushRegistered(
  _userId?: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return { ok: false, skipped: true }
  }
  if (!pb.authStore.isValid) {
    return { ok: false, skipped: true }
  }

  try {
    const registration = await ensureServiceWorker()
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      return enablePushNotifications()
    }
    return postSubscription(subscription.toJSON())
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push sync failed'
    return { ok: false, error: message }
  }
}

export async function setupRemindersForUser(
  profile: { enable_reminders?: boolean } | null | undefined
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!profile?.enable_reminders) {
    return { ok: false, skipped: true }
  }
  return enablePushNotifications()
}

export async function syncPushSubscriptionIfGranted(): Promise<{ ok: boolean; skipped?: boolean }> {
  return ensureServerPushRegistered()
}

export async function enablePushWithFeedback() {
  const result = await enablePushNotifications()
  if (result.ok) {
    NotificationService.triggerNativeNotification(
      'Notifications enabled',
      'You\'ll get smoke check-ins every 6 hours and a daily morning quote — even when smono is closed.'
    )
  }
  return result
}
