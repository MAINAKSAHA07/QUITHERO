import { pb } from './pocketbase'

export type PushNotifyResult =
  | { ok: true; sent: number }
  | { ok: false; error: string; sent?: number }

/** Admin win-back / re-engagement push via API server (VAPID). */
export async function sendUserPushNotification(opts: {
  userId: string
  title: string
  body: string
  url?: string
  tag?: string
  dayNumber?: number
}): Promise<PushNotifyResult> {
  const token = pb.authStore.token
  if (!token) return { ok: false, error: 'Admin session expired. Sign in again.' }

  try {
    const res = await fetch('/api/push/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        userId: opts.userId,
        title: opts.title,
        body: opts.body,
        url: opts.url || '/home',
        tag: opts.tag || 'winback',
        dayNumber: opts.dayNumber,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      sent?: number
      error?: string
    }
    if (!res.ok) {
      return {
        ok: false,
        sent: data.sent ?? 0,
        error: data.error || `Push failed (${res.status})`,
      }
    }
    return { ok: true, sent: data.sent ?? 0 }
  } catch {
    return { ok: false, error: 'Could not reach push service. Is the API server running?' }
  }
}

export function buildWinBackEmail(user: { name?: string; email?: string; programProgress?: number }) {
  const first = (user.name || 'there').split(' ')[0]
  const day = user.programProgress || 1
  const subject = `We've saved your progress — Day ${day} is waiting`
  const body = [
    `Hi ${first},`,
    '',
    `It's been a while — your quit journey is still here when you're ready.`,
    `You left off around Day ${day}. Opening the app picks up where you stopped.`,
    '',
    'https://app.smono.app',
    '',
    '— the smono team',
  ].join('\n')
  return { subject, body, mailto: `mailto:${encodeURIComponent(user.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` }
}
