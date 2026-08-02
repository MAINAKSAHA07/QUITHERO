/**
 * Admin SMTP email send from backoffice (promotions / win-back / notes / blog launch).
 */
import { pb } from './pocketbase'

const BLOG_SITE = 'https://www.smono.app'
const BULK_CHUNK = 50

/**
 * Prefer same-origin `/api/email` (admin.smono.app or vite proxy).
 * Hardcoding app.smono.app is cross-origin and broke some admin sessions.
 */
export function appApiBase(env: {
  VITE_PUSH_API_ORIGIN?: string
  VITE_APP_API_ORIGIN?: string
  PROD?: boolean
} = import.meta.env): string {
  const fromEnv = (
    env.VITE_PUSH_API_ORIGIN ||
    env.VITE_APP_API_ORIGIN ||
    ''
  ).replace(/\/$/, '')
  if (fromEnv) return fromEnv
  // Browser / built admin: relative URL → nginx on this host
  return ''
}

function emailUrl(path: string): string {
  const base = appApiBase()
  return base ? `${base}${path}` : path
}

function authHeaders(): HeadersInit | null {
  const token = pb.authStore.token
  if (!token) return null
  return {
    'Content-Type': 'application/json',
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  }
}

/** SPA HTML 200s look like JSON `{}` — detect before trusting sent counts. */
async function parseEmailApiJson(res: Response): Promise<{
  ok?: boolean
  sent?: number
  failed?: number
  messageId?: string
  error?: string
  failures?: { to: string; error: string }[]
  skipped?: string[]
  quotaExceeded?: boolean
  _html?: boolean
}> {
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (ct.includes('text/html')) return { _html: true, error: 'Email API not proxied (got HTML)' }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return data as {
    ok?: boolean
    sent?: number
    failed?: number
    messageId?: string
    error?: string
    failures?: { to: string; error: string }[]
    skipped?: string[]
    quotaExceeded?: boolean
  }
}

export type SendEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string }

export type SendBulkEmailResult =
  | {
      ok: true
      sent: number
      failed: number
      failures?: { to: string; error: string }[]
      skipped?: string[]
    }
  | {
      ok: false
      error: string
      sent?: number
      failed?: number
      failures?: { to: string; error: string }[]
      /** Addresses never attempted (quota hit mid-batch) — safe to retry as-is. */
      skipped?: string[]
    }

/** Build subject + body + CTA for a new blog post launch email. */
export function buildBlogLaunchEmail(post: {
  title: string
  excerpt?: string
  slug: string
}) {
  const slug = post.slug.replace(/^\/+|\/+$/g, '')
  const url = `${BLOG_SITE}/blog/${slug}/`
  const excerpt =
    (post.excerpt || '').trim() ||
    'A new piece from Smono — short, practical, and built for your quit journey.'
  const title = post.title.trim()
  return {
    subject: `New on Smono: ${title}`,
    text: [
      'Hi,',
      '',
      `We just published a new post: ${title}`,
      '',
      excerpt,
      '',
      `Read it here: ${url}`,
      '',
      '— Smono',
    ].join('\n'),
    title,
    preheader: excerpt.slice(0, 120),
    ctaLabel: 'Read the post',
    ctaUrl: url,
  }
}

export async function sendAdminEmail(opts: {
  to: string
  subject: string
  text?: string
  html?: string
  title?: string
  ctaLabel?: string
  ctaUrl?: string
  preheader?: string
}): Promise<SendEmailResult> {
  const headers = authHeaders()
  if (!headers) return { ok: false, error: 'Admin session expired. Sign in again.' }
  const to = opts.to.trim()
  if (!to) return { ok: false, error: 'User has no email address.' }
  if (!opts.subject.trim()) return { ok: false, error: 'Subject required.' }
  if (!opts.text && !opts.html) return { ok: false, error: 'Message body required.' }

  try {
    const res = await fetch(emailUrl('/api/email/send'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to,
        subject: opts.subject.trim(),
        text: opts.text,
        html: opts.html,
        title: opts.title,
        ctaLabel: opts.ctaLabel,
        ctaUrl: opts.ctaUrl,
        preheader: opts.preheader,
      }),
    })
    const data = await parseEmailApiJson(res)
    if (data._html) {
      return {
        ok: false,
        error:
          'Email API not reachable from admin. Redeploy backoffice so /api/email proxies to app.smono.app.',
      }
    }
    if (!res.ok || data.ok === false) {
      return { ok: false, error: data.error || `Email failed (${res.status})` }
    }
    return { ok: true, messageId: data.messageId }
  } catch {
    return {
      ok: false,
      error: 'Could not reach email API. Check VITE_PUSH_API_ORIGIN / app API is up.',
    }
  }
}

/** Chunked bulk send (API max 50 per request). Dedupes emails. */
export async function sendAdminBulkEmail(opts: {
  emails: string[]
  subject: string
  text?: string
  html?: string
  title?: string
  ctaLabel?: string
  ctaUrl?: string
  preheader?: string
}): Promise<SendBulkEmailResult> {
  const headers = authHeaders()
  if (!headers) return { ok: false, error: 'Admin session expired. Sign in again.' }
  if (!opts.subject.trim()) return { ok: false, error: 'Subject required.' }
  if (!opts.text && !opts.html) return { ok: false, error: 'Message body required.' }

  const emails = [
    ...new Set(
      opts.emails.map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@'))
    ),
  ]
  if (!emails.length) return { ok: false, error: 'No user emails to notify.' }

  let sent = 0
  let failed = 0
  const failures: { to: string; error: string }[] = []
  try {
    for (let i = 0; i < emails.length; i += BULK_CHUNK) {
      const chunk = emails.slice(i, i + BULK_CHUNK)
      const res = await fetch(emailUrl('/api/email/send-bulk'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          emails: chunk,
          subject: opts.subject.trim(),
          text: opts.text,
          html: opts.html,
          title: opts.title,
          ctaLabel: opts.ctaLabel,
          ctaUrl: opts.ctaUrl,
          preheader: opts.preheader,
        }),
      })
      const data = await parseEmailApiJson(res)
      if (data._html) {
        return {
          ok: false,
          error:
            'Email API not reachable from admin. Redeploy backoffice so /api/email proxies to app.smono.app.',
          sent,
          failed: failed + chunk.length,
          failures,
        }
      }
      // Previously: only failed when !res.ok AND data.error — SPA/HTML 404s
      // looked like success with sent:0 (terminal curl still worked).
      if (!res.ok) {
        return {
          ok: false,
          error: data.error || `Email API failed (${res.status})`,
          sent,
          failed: failed + chunk.length,
          failures,
        }
      }
      // Empty {} from SPA rewrite has no `sent` key — treat as misconfigured proxy.
      if (typeof data.sent !== 'number' && data.ok !== true && data.ok !== false) {
        return {
          ok: false,
          error:
            'Email API returned an empty response. Check admin is proxying /api/email to app.smono.app.',
          sent,
          failed: failed + chunk.length,
          failures,
        }
      }
      sent += Number(data.sent || 0)
      failed += Number(data.failed || 0)
      if (Array.isArray(data.failures)) failures.push(...data.failures)
      if (data.quotaExceeded) {
        const untried = [
          ...(Array.isArray(data.skipped) ? data.skipped : []),
          ...emails.slice(i + BULK_CHUNK),
        ]
        return {
          ok: false,
          error: `Daily sending limit reached after ${sent} email(s). ${untried.length} not attempted — retry them once the quota resets.`,
          sent,
          failed,
          failures,
          skipped: untried,
        }
      }
      if (data.ok === false && Number(data.sent || 0) === 0) {
        const sample = (data.failures || [])
          .slice(0, 3)
          .map((f) => `${f.to}: ${f.error}`)
          .join('; ')
        return {
          ok: false,
          error:
            data.error ||
            (sample
              ? `All emails failed — ${sample}`
              : 'All emails failed to send'),
          sent,
          failed: failed || chunk.length,
          failures: failures.length ? failures : data.failures,
        }
      }
    }
    if (failed > 0) {
      const sample = failures
        .slice(0, 3)
        .map((f) => `${f.to}: ${f.error}`)
        .join('; ')
      return {
        ok: false,
        error: `${failed} email(s) failed${sample ? ` — ${sample}` : ''}`,
        sent,
        failed,
        failures,
      }
    }
    if (sent === 0 && emails.length > 0) {
      return {
        ok: false,
        error:
          'API returned success but sent 0. Check admin is proxying /api/email to app.smono.app (Vercel rewrite).',
        sent: 0,
        failed: emails.length,
        failures,
      }
    }
    return { ok: true, sent, failed, failures }
  } catch {
    return {
      ok: false,
      error: 'Could not reach email API. Check VITE_PUSH_API_ORIGIN / app API is up.',
      sent,
      failed,
      failures,
    }
  }
}
