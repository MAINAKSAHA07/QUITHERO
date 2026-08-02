/**
 * Admin email API — promotions / outreach.
 * POST /api/email/send  { to, subject, text?, html?, title?, ctaLabel?, ctaUrl?, preheader?, replyTo? }
 * POST /api/email/send-bulk { emails: string[], subject, text?, html?, title?, ctaLabel?, ctaUrl?, preheader? }  (max 50)
 * GET  /api/email/health
 */
import { getAuthAdmin, adminAuth, getPbUrl } from './pb-admin.js'
import { isSmtpReady, sendMail, sleep } from './mail.js'
import { isEmailNotificationsEnabled } from './email-enabled.js'
import { applyEmailTemplateVars } from './email-templates.js'
import { getDailyQuoteText } from './daily-quote.js'

/**
 * Mailbox-level refusals (daily cap, rate limit) — the rest of the batch cannot
 * succeed either, so the caller should stop rather than fail every address.
 */
export function isSendQuotaError(message) {
  return /5\.4\.5|4\.7\.0|daily user sending limit|sending limits|rate limit|too many (messages|recipients)|try again later/i.test(
    String(message || '')
  )
}

/** Resolve {{user.name}} / {{quote}} etc. for one recipient. */
async function mailVarsForEmail(toEmail, extra = {}) {
  const email = String(toEmail || '').trim().toLowerCase()
  let name = ''
  try {
    const token = await adminAuth()
    if (token && email) {
      const pb = getPbUrl()
      const filter = encodeURIComponent(`email = "${email.replace(/"/g, '')}"`)
      const res = await fetch(
        `${pb}/api/collections/users/records?filter=${filter}&perPage=1&fields=id,email,name`,
        { headers: { Authorization: token } }
      ).catch(() => null)
      if (res?.ok) {
        const data = await res.json()
        name = String(data.items?.[0]?.name || '').trim()
      }
    }
  } catch {
    /* best-effort — still send with fallbacks */
  }
  const first = (name || 'there').split(/\s+/)[0] || 'there'
  let quote =
    extra.quote != null && String(extra.quote).trim() ? String(extra.quote).trim() : ''
  if (!quote) {
    try {
      const token = await adminAuth()
      quote = token ? await getDailyQuoteText(token, 'en') : ''
    } catch {
      /* fallback below */
    }
  }
  if (!quote) quote = 'One small step today is enough.'
  return {
    ...extra,
    user: { name: name || first, email },
    'user.name': name || first,
    'user.email': email,
    name: name || first,
    quote,
    day: extra.day != null ? String(extra.day) : '',
  }
}

function personalizeMailFields(fields, vars) {
  const out = {}
  for (const [k, v] of Object.entries(fields)) {
    out[k] = v == null ? v : applyEmailTemplateVars(String(v), vars)
  }
  return out
}

export async function handleEmailApi(req, res, pathname, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (pathname === '/api/email/health' && req.method === 'GET') {
    const emailEnabled = await isEmailNotificationsEnabled()
    return json(res, 200, { ok: true, smtp: isSmtpReady(), emailEnabled })
  }

  const auth = req.headers.authorization
  if (!auth) return json(res, 401, { error: 'Admin login required' })
  const admin = await getAuthAdmin(auth)
  if (!admin?.id) return json(res, 401, { error: 'Invalid or expired admin session' })

  if (!isSmtpReady()) {
    return json(res, 503, {
      error: 'SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS (see .env.example).',
    })
  }

  let body
  try {
    body = JSON.parse((await readBody(req)).toString() || '{}')
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  if (pathname === '/api/email/send' && req.method === 'POST') {
    const to = String(body.to || '').trim()
    const subject = String(body.subject || '').trim().slice(0, 200)
    const text = body.text != null ? String(body.text) : undefined
    const html = body.html != null ? String(body.html) : undefined
    const replyTo = body.replyTo ? String(body.replyTo).trim() : undefined
    if (!to || !subject) return json(res, 400, { error: 'to and subject required' })
    if (!text && !html) return json(res, 400, { error: 'text or html required' })
    try {
      const vars = await mailVarsForEmail(to, body.vars && typeof body.vars === 'object' ? body.vars : {})
      const filled = personalizeMailFields(
        {
          subject,
          text,
          html,
          title: body.title ? String(body.title) : undefined,
          ctaLabel: body.ctaLabel ? String(body.ctaLabel) : undefined,
          ctaUrl: body.ctaUrl ? String(body.ctaUrl) : undefined,
          preheader: body.preheader ? String(body.preheader) : undefined,
        },
        vars
      )
      const info = await sendMail({
        to,
        subject: filled.subject,
        text: filled.text,
        html: filled.html,
        replyTo,
        title: filled.title,
        ctaLabel: filled.ctaLabel,
        ctaUrl: filled.ctaUrl,
        preheader: filled.preheader,
      })
      return json(res, 200, { ok: true, messageId: info.messageId, accepted: info.accepted })
    } catch (err) {
      if (err?.code === 'EMAIL_DEACTIVATED') {
        return json(res, 403, { error: err.message, code: 'EMAIL_DEACTIVATED' })
      }
      console.error('[email/send]', err.message)
      return json(res, 500, { error: err.message || 'send failed' })
    }
  }

  if (pathname === '/api/email/send-bulk' && req.method === 'POST') {
    const emails = [
      ...new Set(
        (Array.isArray(body.emails) ? body.emails : [])
          .map((e) => String(e).trim().toLowerCase())
          .filter((e) => e.includes('@'))
      ),
    ]
    const subject = String(body.subject || '').trim().slice(0, 200)
    const text = body.text != null ? String(body.text) : undefined
    const html = body.html != null ? String(body.html) : undefined
    if (!emails.length || !subject) return json(res, 400, { error: 'emails[] and subject required' })
    if (!text && !html) return json(res, 400, { error: 'text or html required' })
    if (emails.length > 50) return json(res, 400, { error: 'Max 50 recipients per request' })

    if (!(await isEmailNotificationsEnabled())) {
      return json(res, 403, {
        error: 'Email notifications are deactivated in App Settings',
        code: 'EMAIL_DEACTIVATED',
      })
    }

    let sent = 0
    const failures = []
    let quotaExceeded = false
    let stoppedAt = -1
    const title = body.title ? String(body.title) : undefined
    const ctaLabel = body.ctaLabel ? String(body.ctaLabel) : undefined
    const ctaUrl = body.ctaUrl ? String(body.ctaUrl) : undefined
    const preheader = body.preheader ? String(body.preheader) : undefined
    const extraVars = body.vars && typeof body.vars === 'object' ? body.vars : {}
    // ~1/sec — Gmail free SMTP otherwise accepts only the first, drops the rest
    const gapMs = Number(process.env.SMTP_BULK_GAP_MS || 1100)

    for (let i = 0; i < emails.length; i++) {
      const to = emails[i]
      try {
        const vars = await mailVarsForEmail(to, extraVars)
        const filled = personalizeMailFields(
          { subject, text, html, title, ctaLabel, ctaUrl, preheader },
          vars
        )
        const info = await sendMail({
          to,
          subject: filled.subject,
          text: filled.text,
          html: filled.html,
          title: filled.title,
          ctaLabel: filled.ctaLabel,
          ctaUrl: filled.ctaUrl,
          preheader: filled.preheader,
          bypassEmailKillSwitch: true,
        })
        sent++
        console.log(`[email/bulk] ok ${i + 1}/${emails.length} → ${to} id=${info.messageId || '-'}`)
      } catch (err) {
        const msg = err.message || 'failed'
        failures.push({ to, error: msg })
        console.error(`[email/bulk] fail → ${to}: ${msg}`)
        if (isSendQuotaError(msg)) {
          quotaExceeded = true
          stoppedAt = i
          break
        }
      }
      if (i < emails.length - 1 && gapMs > 0) await sleep(gapMs)
    }

    // Once the mailbox refuses on quota, every later address fails too. Report
    // them as untried so the operator can retry exactly those after the reset.
    const skipped = quotaExceeded ? emails.slice(stoppedAt + 1) : []
    if (quotaExceeded) {
      console.error(
        `[email/bulk] quota reached after ${sent} sent — ${skipped.length} not attempted`
      )
    }

    return json(res, 200, {
      ok: failures.length === 0,
      sent,
      failed: failures.length,
      failures,
      skipped,
      quotaExceeded,
      total: emails.length,
    })
  }

  return json(res, 404, { error: 'not_found' })
}
