/**
 * Shared Smono transactional / promo HTML — Apple-inspired:
 * purpose (one job), simplicity, calm hierarchy, one clear CTA.
 * Safe for Gmail / Apple Mail (table layout, inline styles).
 */

const BRAND = {
  bg: '#F4FBFF',
  card: '#FFFFFF',
  text: '#0E2538',
  muted: '#5A7384',
  primary: '#3F8DD2',
  border: 'rgba(14, 37, 56, 0.08)',
  appUrl: 'https://app.smono.app',
  siteUrl: 'https://www.smono.app',
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Fill {{user.name}}, {{quote}}, etc. Unknown keys → '' so outbound mail never shows raw tags.
 * Supports dotted keys and a flat map ('user.name': 'Ada').
 */
export function applyEmailTemplateVars(input, vars = {}) {
  return String(input ?? '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null) {
      return String(vars[key])
    }
    let cur = vars
    for (const part of String(key).split('.')) {
      if (cur == null || typeof cur !== 'object') {
        cur = undefined
        break
      }
      cur = cur[part]
    }
    if (cur == null || typeof cur === 'object') return ''
    return String(cur)
  })
}

/** True when body is a full email document (not a fragment). */
export function isFullHtmlDocument(html) {
  return /<!DOCTYPE\s+html|<html[\s>]/i.test(String(html || '').trim())
}

/** Strip tags for multipart text/plain — Gmail often drops html-only bulk. */
export function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function plainToHtmlParagraphs(text) {
  const safe = escapeHtml(text).replace(/\r\n/g, '\n')
  return safe
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.trim().split('\n').join('<br>')
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${BRAND.text};">${lines}</p>`
    })
    .join('')
}

/**
 * @param {{
 *   title: string
 *   preheader?: string
 *   bodyHtml: string
 *   ctaLabel?: string
 *   ctaUrl?: string
 *   footerNote?: string
 * }} opts
 */
export function renderSmonoEmail(opts) {
  const title = opts.title || 'Smono'
  const preheader = opts.preheader || ''
  const bodyHtml = opts.bodyHtml || ''
  const ctaLabel = opts.ctaLabel
  const ctaUrl = opts.ctaUrl
  const footerNote =
    opts.footerNote ||
    'You’re receiving this because you have a Smono account. Reply to this email if you need help.'

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
      <tr>
        <td style="padding:8px 28px 28px;">
          <a href="${escapeHtml(ctaUrl)}"
             style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;letter-spacing:-0.01em;padding:14px 28px;border-radius:14px;">
            ${escapeHtml(ctaLabel)}
          </a>
        </td>
      </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border-radius:20px;border:1px solid ${BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primary};">Smono</p>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 28px 8px;">
              <h1 style="margin:0;font-size:26px;line-height:1.2;letter-spacing:-0.025em;font-weight:700;color:${BRAND.text};">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 0;">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.muted};">${escapeHtml(footerNote)}</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:${BRAND.muted};">
          <a href="${BRAND.siteUrl}" style="color:${BRAND.muted};text-decoration:none;">smono.app</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Wrap plain outreach copy in the brand layout. */
export function wrapPlainEmail(text, { title, ctaLabel, ctaUrl, preheader, footerNote } = {}) {
  return renderSmonoEmail({
    title: title || 'A note from Smono',
    preheader,
    bodyHtml: plainToHtmlParagraphs(text),
    ctaLabel,
    ctaUrl,
    footerNote,
  })
}

/** Subject + body + CTA for a new blog post launch (backoffice notify). */
export function buildBlogLaunchEmail(post) {
  const slug = String(post.slug || '')
    .replace(/^\/+|\/+$/g, '')
    .trim()
  const url = `${BRAND.siteUrl}/blog/${slug}/`
  const excerpt =
    String(post.excerpt || '').trim() ||
    'A new piece from Smono — short, practical, and built for your quit journey.'
  const title = String(post.title || '').trim()
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

/** After admin accepts deletion — account gone, door left open. */
export function buildDeletionAcceptedEmail({ name } = {}) {
  const first = String(name || 'there').trim().split(/\s+/)[0] || 'there'
  return {
    subject: 'Your Smono account deletion request was accepted',
    text: [
      `Hi ${first},`,
      '',
      'Your request to delete your Smono account has been accepted. Your account and program data have been removed.',
      '',
      'We look forward to hearing from you again — and we’d be glad to see you on your journey whenever you’re ready.',
      '',
      'If you need anything, reply to this email or write to support@smono.app.',
      '',
      '— Smono',
    ].join('\n'),
    title: 'Request accepted',
    preheader: 'Your account has been deleted. The door stays open if you return.',
    ctaLabel: 'Visit Smono',
    ctaUrl: BRAND.siteUrl,
  }
}

/** Welcome email for new users who just paid. */
export function buildWelcomeEmail({ name } = {}) {
  const first = String(name || 'there').trim().split(/\s+/)[0] || 'there'
  return {
    subject: 'Welcome to Smono — your quit starts here',
    text: [
      `Hi ${first},`,
      '',
      'Welcome to Smono. This isn\'t a streak tracker — it\'s a structured program to change how you think and feel about smoking.',
      '',
      'Your full 30-day program is ready. Open the app when you\'re ready — Day 1 is waiting.',
      '',
      '— Smono',
    ].join('\n'),
    title: 'Welcome to Smono',
    preheader: 'Your 30-day quit program is ready. Day 1 is waiting.',
    ctaLabel: 'Start Day 1',
    ctaUrl: BRAND.appUrl,
  }
}

/** After successful purchase / unlock. */
export function buildPurchaseEmail({ name } = {}) {
  const first = String(name || 'there').trim().split(/\s+/)[0] || 'there'
  return {
    subject: 'You’re in — full access to Smono',
    text: [
      `Hi ${first},`,
      '',
      'Your purchase went through. Full program access is unlocked on your account.',
      '',
      'Open the app and continue from where you left off — every session is designed to change how smoking feels, not just track days.',
      '',
      '— Smono',
    ].join('\n'),
    title: 'You’re all set',
    preheader: 'Full access is unlocked. Continue your quit program.',
    ctaLabel: 'Open my program',
    ctaUrl: BRAND.appUrl,
  }
}

export function buildGiftBuyerEmail({ buyerName, recipientName, recipientEmail } = {}) {
  const buyer = String(buyerName || 'there').trim().split(/\s+/)[0] || 'there'
  const recipient = String(recipientName || 'your loved one').trim() || 'your loved one'
  const to = String(recipientEmail || '').trim()
  return {
    subject: `Your Smono gift for ${recipient} is on its way`,
    text: [
      `Hi ${buyer},`,
      '',
      `Your gift for ${recipient} is paid.`,
      to
        ? `Their invitation was sent to ${to}. Only they can claim and unlock the program.`
        : 'Their invitation is on its way. Only they can claim and unlock the program.',
      '',
      '— Smono',
    ].join('\n'),
    title: 'Gift sent',
    preheader: `Your gift for ${recipient} is on its way.`,
    ctaLabel: 'Learn about Smono',
    ctaUrl: BRAND.siteUrl,
  }
}

export function buildGiftRecipientEmail({ recipientName, buyerName, message, claimUrl } = {}) {
  const recipient = String(recipientName || 'there').trim().split(/\s+/)[0] || 'there'
  const buyer = String(buyerName || 'Someone who cares about you').trim()
  const note = String(message || '').trim()
  return {
    subject: `${buyer} gifted you a new start with Smono`,
    text: [
      `Hi ${recipient},`,
      '',
      `${buyer} has gifted you full access to Smono’s 30-day quit-smoking program.`,
      ...(note ? ['', `Their message: “${note}”`] : []),
      '',
      'Use the link below and sign in with this email address to claim your gift.',
      '',
      String(claimUrl || BRAND.appUrl),
      '',
      '— Smono',
    ].join('\n'),
    title: 'A new start, from someone who cares',
    preheader: `${buyer} gifted you full access to Smono.`,
    ctaLabel: 'Claim my gift',
    ctaUrl: String(claimUrl || BRAND.appUrl),
  }
}

/** Daily reminder / quote email. */
export function buildDailyReminderEmail({ name, quote, reminderTime } = {}) {
  const first = String(name || 'there').trim().split(/\s+/)[0] || 'there'
  const body = String(quote || 'One small step today is enough.').trim()
  return {
    subject: 'Your Smono check-in',
    text: [
      `Hi ${first},`,
      '',
      body,
      '',
      reminderTime ? `This is your daily reminder (${reminderTime}).` : 'This is your daily reminder.',
      '',
      'Open the app for today’s session.',
      '',
      '— Smono',
    ].join('\n'),
    title: 'A moment for you',
    preheader: body.slice(0, 120),
    ctaLabel: 'Open Smono',
    ctaUrl: BRAND.appUrl,
  }
}

/** PocketBase auth mail bodies — placeholders {APP_NAME} {APP_URL} {TOKEN} stay literal. */
export function pbAuthEmailBodies() {
  const resetBody = renderSmonoEmail({
    title: 'Reset your password',
    preheader: 'Choose a new password for your Smono account.',
    bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${BRAND.text};">
      We received a request to reset your {APP_NAME} password. Tap below to choose a new one.
      This link expires in 30 minutes.
    </p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${BRAND.muted};">
      If you didn’t ask for this, you can ignore this email — your password stays the same.
    </p>`,
    ctaLabel: 'Choose new password',
    ctaUrl: '{APP_URL}/confirm-password-reset?token={TOKEN}',
    footerNote: 'For your security, never share this email with anyone.',
  })

  const verifyBody = renderSmonoEmail({
    title: 'Confirm your email',
    preheader: 'Verify your Smono account email.',
    bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${BRAND.text};">
      Welcome to {APP_NAME}. Confirm this email so we can keep your account secure and send progress updates.
    </p>`,
    ctaLabel: 'Verify email',
    ctaUrl: '{APP_URL}/login?verified=1&token={TOKEN}',
    footerNote: 'If you didn’t create a Smono account, you can ignore this message.',
  })

  const emailChangeBody = renderSmonoEmail({
    title: 'Confirm your new email',
    preheader: 'Confirm the new email for your Smono account.',
    bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${BRAND.text};">
      Tap below to confirm this as the new email for your {APP_NAME} account.
    </p>`,
    ctaLabel: 'Confirm new email',
    ctaUrl: '{APP_URL}/login?email-change=1&token={TOKEN}',
    footerNote: 'If you didn’t request an email change, contact support@smono.app.',
  })

  return {
    reset: {
      subject: 'Reset your Smono password',
      body: resetBody,
    },
    verification: {
      subject: 'Confirm your Smono email',
      body: verifyBody,
    },
    emailChange: {
      subject: 'Confirm your new Smono email',
      body: emailChangeBody,
    },
  }
}

/**
 * Compose defaults for Bulk Email / admin — title + CTA live outside `content`
 * so we never store a full branded HTML doc (that double-wraps on send).
 */
export function emailComposeDefaults(appUrl = BRAND.appUrl) {
  return {
    user_registered: {
      title: 'You’re in the right place',
      ctaLabel: 'Open Smono',
      ctaUrl: appUrl,
    },
    user_inactive: {
      title: 'Your journey is still here',
      ctaLabel: 'Continue my program',
      ctaUrl: appUrl,
    },
    purchase_success: {
      title: 'You’re all set',
      ctaLabel: 'Open my program',
      ctaUrl: appUrl,
    },
    daily_reminder: {
      title: 'A moment for you',
      ctaLabel: 'Open Smono',
      ctaUrl: appUrl,
    },
    segment_reminder: {
      title: '{{reminder_title}}',
      ctaLabel: '{{cta_label}}',
      ctaUrl: '{{cta_url}}',
    },
    promotion: {
      title: '{{promo_title}}',
      ctaLabel: '{{cta_label}}',
      ctaUrl: '{{cta_url}}',
    },
    blog_published: {
      title: '{{blog_title}}',
      ctaLabel: 'Read the post',
      ctaUrl: '{{blog_url}}',
    },
    support_ticket_response: {
      title: 'You have a new reply',
      ctaLabel: 'Open Messages',
      ctaUrl: `${appUrl}/profile?support=1`,
    },
  }
}

const FROM_EMAIL = 'support@smono.app'

/** Seed content for notification_templates — plain body only (server wraps once). */
export function seedEmailTemplateDefs(appUrl = BRAND.appUrl) {
  return [
    {
      name: 'Welcome',
      type: 'email',
      trigger_event: 'user_registered',
      language: 'en',
      is_active: true,
      subject: 'Welcome to Smono — your quit starts here',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: [
        'Hi {{user.name}}, welcome to Smono. This isn’t a streak tracker — it’s a structured program to change how you think and feel about smoking.',
        '',
        'Open the app when you’re ready. Day 1 is waiting.',
      ].join('\n'),
    },
    {
      name: 'Password reset (mirror)',
      type: 'email',
      trigger_event: 'password_reset',
      language: 'en',
      is_active: true,
      subject: 'Reset your Smono password',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: 'Handled by PocketBase auth mailer — see setup-password-reset.js',
    },
    {
      name: 'Win-back / inactivity',
      type: 'email',
      trigger_event: 'user_inactive',
      language: 'en',
      is_active: true,
      subject: "We've saved your progress — Day {{day}} is waiting",
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: [
        'Hi {{user.name}}, it’s been a while. That’s okay. Your quit program is still saved, and you can continue from Day {{day}} whenever you’re ready.',
        '',
        'One open is enough to restart momentum.',
      ].join('\n'),
    },
    {
      name: 'Purchase confirmation',
      type: 'email',
      trigger_event: 'purchase_success',
      language: 'en',
      is_active: true,
      subject: 'You’re in — full access to Smono',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: [
        'Hi {{user.name}}, your purchase went through. Full program access is unlocked on your account.',
        '',
        'Open the app and continue from where you left off — every session is designed to change how smoking feels, not just track days.',
      ].join('\n'),
    },
    {
      name: 'Gift buyer confirmation',
      type: 'email',
      trigger_event: 'gift_buyer',
      language: 'en',
      is_active: true,
      subject: 'Your Smono gift is ready',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: 'Transactional gift receipt generated by the API.',
    },
    {
      name: 'Gift recipient invitation',
      type: 'email',
      trigger_event: 'gift_recipient',
      language: 'en',
      is_active: true,
      subject: 'Someone gifted you a new start with Smono',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: 'Transactional gift invitation generated by the API.',
    },
    {
      name: 'Account deletion accepted',
      type: 'email',
      trigger_event: 'account_deletion_accepted',
      language: 'en',
      is_active: true,
      subject: 'Your Smono account deletion request was accepted',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: [
        'Hi {{user.name}},',
        '',
        'Your request to delete your Smono account has been accepted. Your account and program data have been removed.',
        '',
        'We look forward to hearing from you again — and we’d be glad to see you on your journey whenever you’re ready.',
      ].join('\n'),
    },
    {
      name: 'Daily reminder',
      type: 'email',
      trigger_event: 'daily_reminder',
      language: 'en',
      is_active: true,
      subject: 'Your Smono check-in',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: [
        'Hi {{user.name}},',
        '',
        '{{quote}}',
        '',
        'This is your daily reminder. Open the app for today’s session.',
      ].join('\n'),
    },
    {
      name: 'Segment reminder',
      type: 'email',
      trigger_event: 'segment_reminder',
      language: 'en',
      is_active: true,
      subject: '{{reminder_subject}}',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: '{{reminder_body}}',
    },
    {
      name: 'Promotion',
      type: 'email',
      trigger_event: 'promotion',
      language: 'en',
      is_active: true,
      subject: '{{promo_subject}}',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: '{{promo_body}}',
    },
    {
      name: 'Blog published',
      type: 'email',
      trigger_event: 'blog_published',
      language: 'en',
      is_active: true,
      subject: 'New on Smono: {{blog_title}}',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: [
        'We just published a new post on the Smono blog.',
        '',
        '{{blog_excerpt}}',
      ].join('\n'),
    },
    {
      name: 'Support reply notify',
      type: 'email',
      trigger_event: 'support_ticket_response',
      language: 'en',
      is_active: true,
      subject: 'Smono replied to your message',
      from_name: 'Smono',
      from_email: FROM_EMAIL,
      content: 'Hi {{user.name}}, the Smono team replied to your support message.',
    },
  ]
}

export { BRAND, escapeHtml, plainToHtmlParagraphs }
