/**
 * Shared SMTP mailer for promo / transactional sends from the API server.
 * Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM, SMTP_FROM_NAME
 * Gated by app_settings.notifications.emailNotificationsEnabled (push is independent).
 *
 * Gmail free SMTP: keep rateLimit low — burst sends look like spam and only
 * the first recipient (often the account owner) gets delivered.
 */
import nodemailer from 'nodemailer'
import {
  wrapPlainEmail,
  renderSmonoEmail,
  htmlToPlainText,
  isFullHtmlDocument,
} from './email-templates.js'
import { isEmailNotificationsEnabled } from './email-enabled.js'

export function isSmtpReady() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.SMTP_FROM || process.env.SMTP_USER)
  )
}

export function smtpConfigFromEnv() {
  const port = Number(process.env.SMTP_PORT || 587)
  const secureEnv = (process.env.SMTP_SECURE || '').toLowerCase()
  // 465 = implicit SSL; 587 = STARTTLS (secure:false)
  const secure =
    secureEnv === 'ssl' || secureEnv === 'tls' || secureEnv === 'true' || port === 465
  const host = (process.env.SMTP_HOST || '').trim()
  const isGmail = /gmail\.com$/i.test(host)
  const cfg = {
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    // One connection + slow drip — Gmail drops burst sends after the first
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: isGmail ? 1 : 5,
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').trim(),
    },
  }
  // ponytail: don't EHLO as smono.app on Gmail — can hurt relay; only set for real MTAs
  const localName = (process.env.SMTP_LOCAL_NAME || '').trim()
  if (localName && !isGmail) cfg.name = localName
  return cfg
}

export function mailFrom() {
  const address = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim()
  const name = process.env.SMTP_FROM_NAME || 'Smono'
  return name ? `"${name}" <${address}>` : address
}

let transporter = null

export function getMailTransporter() {
  if (!isSmtpReady()) return null
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpConfigFromEnv())
  }
  return transporter
}

/** Reset cached transport after config change (tests). */
export function resetMailTransporter() {
  if (transporter) {
    try {
      transporter.close()
    } catch {
      /* ignore */
    }
  }
  transporter = null
}

/**
 * @param {{ to: string|string[], subject: string, text?: string, html?: string, replyTo?: string, title?: string, ctaLabel?: string, ctaUrl?: string, preheader?: string, bypassEmailKillSwitch?: boolean }} opts
 */
export async function sendMail(opts) {
  if (!opts.bypassEmailKillSwitch) {
    const allowed = await isEmailNotificationsEnabled()
    if (!allowed) {
      const err = new Error('Email notifications are deactivated in App Settings')
      err.code = 'EMAIL_DEACTIVATED'
      throw err
    }
  }
  const tx = getMailTransporter()
  if (!tx) throw new Error('SMTP not configured')
  const to = Array.isArray(opts.to) ? opts.to.join(', ') : String(opts.to || '').trim()
  if (!to || !opts.subject) throw new Error('to and subject required')

  const from = mailFrom()

  // Build multipart like working transactional mail. Gmail free SMTP often
  // accepts html-only into Sent then never delivers to other inboxes.
  let text = opts.text != null && String(opts.text).trim() ? String(opts.text) : undefined
  let html = opts.html != null && String(opts.html).trim() ? String(opts.html) : undefined

  if (text && !html) {
    html = wrapPlainEmail(text, {
      title: opts.title || opts.subject,
      ctaLabel: opts.ctaLabel,
      ctaUrl: opts.ctaUrl,
      preheader: opts.preheader,
    })
  } else if (html) {
    if (!text) text = htmlToPlainText(html) || String(opts.subject || '')
    // Fragments → same branded shell as promo/reminder (better delivery)
    if (!isFullHtmlDocument(html)) {
      html = renderSmonoEmail({
        title: opts.title || opts.subject,
        preheader: opts.preheader,
        bodyHtml: html,
        ctaLabel: opts.ctaLabel,
        ctaUrl: opts.ctaUrl,
      })
    }
  }

  if (!text && !html) throw new Error('text or html required')

  const info = await tx.sendMail({
    from,
    to,
    subject: opts.subject,
    text,
    html,
    replyTo: opts.replyTo || undefined,
    // Let nodemailer build the envelope — explicit envelope confused Gmail relay for some sends
  })

  const rejected = info.rejected || []
  if (rejected.length) {
    const err = new Error(`SMTP rejected: ${rejected.join(', ')}`)
    err.code = 'SMTP_REJECTED'
    err.rejected = rejected
    throw err
  }
  return info
}

/** Delay helper for bulk loops (ms). */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
