import { pb } from './pocketbase'

export type AdminMessageResult =
  | { ok: true; ticketId: string; messageId?: string }
  | { ok: false; error: string }

/**
 * Support/push APIs live on the app host (EC2), not the backoffice static host.
 * Relative /api/* fails in prod (Vercel SPA → 405).
 */
function appApiBase(): string {
  const fromEnv = (
    import.meta.env.VITE_PUSH_API_ORIGIN ||
    import.meta.env.VITE_APP_API_ORIGIN ||
    ''
  ).replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (import.meta.env.PROD) return 'https://app.smono.app'
  return ''
}

function supportUrl(path: string): string {
  const base = appApiBase()
  return base ? `${base}${path}` : path
}

/** Store admin outreach in the user's Messages inbox + push deep-link to that thread. */
export async function sendUserAdminMessage(opts: {
  userId: string
  title: string
  body: string
}): Promise<AdminMessageResult> {
  const token = pb.authStore.token
  if (!token) return { ok: false, error: 'Admin session expired. Sign in again.' }

  try {
    const res = await fetch(supportUrl('/api/support/admin-message'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        userId: opts.userId,
        title: opts.title,
        body: opts.body,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      ticketId?: string
      messageId?: string
      error?: string
    }
    if (!res.ok || !data.ticketId) {
      return {
        ok: false,
        error: data.error || `Message failed (${res.status})`,
      }
    }
    return { ok: true, ticketId: data.ticketId, messageId: data.messageId }
  } catch {
    return {
      ok: false,
      error: 'Could not reach Messages API. Check VITE_PUSH_API_ORIGIN / app API is up.',
    }
  }
}

/** @deprecated Prefer sendUserAdminMessage — push-only does not land in inbox. */
export async function sendUserPushNotification(opts: {
  userId: string
  title: string
  body: string
  url?: string
  tag?: string
  dayNumber?: number
}): Promise<AdminMessageResult & { sent?: number }> {
  return sendUserAdminMessage({
    userId: opts.userId,
    title: opts.title,
    body: opts.body,
  })
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
    '— the smono team',
  ].join('\n')
  return {
    subject,
    body,
    to: user.email || '',
    title: 'Your journey is still here',
    ctaLabel: 'Continue my program',
    ctaUrl: 'https://app.smono.app',
    preheader: 'Pick up where you left off — no judgment.',
  }
}
