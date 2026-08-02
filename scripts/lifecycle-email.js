/**
 * Lifecycle emails fired from server (purchase unlock, daily reminder).
 * Failures are logged; never block entitlement writes.
 * Respects email kill-switch + per-template is_active; never touches push.
 */
import { adminAuth, getPbUrl } from './pb-admin.js'
import { isSmtpReady, sendMail } from './mail.js'
import { isEmailTemplateActive } from './email-enabled.js'
import {
  buildWelcomeEmail,
  buildPurchaseEmail,
  buildDailyReminderEmail,
  buildGiftBuyerEmail,
  buildGiftRecipientEmail,
} from './email-templates.js'

async function fetchUser(userId) {
  const token = await adminAuth()
  if (!token || !userId) return null
  const pb = getPbUrl()
  const res = await fetch(
    `${pb}/api/collections/users/records/${userId}?fields=id,email,name`,
    { headers: { Authorization: token } }
  ).catch(() => null)
  if (!res?.ok) return null
  return res.json()
}

/** Welcome email for brand-new paying users. */
export async function sendWelcomeEmail(userId) {
  if (!isSmtpReady()) return { skipped: 'smtp' }
  if (!(await isEmailTemplateActive('user_registered'))) {
    return { skipped: 'email_deactivated' }
  }
  const user = await fetchUser(userId)
  const email = String(user?.email || '').trim()
  if (!email) return { skipped: 'no_email' }

  const mail = buildWelcomeEmail({ name: user.name || '' })
  try {
    const info = await sendMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      title: mail.title,
      ctaLabel: mail.ctaLabel,
      ctaUrl: mail.ctaUrl,
      preheader: mail.preheader,
    })
    return { ok: true, messageId: info.messageId, to: email }
  } catch (err) {
    if (err?.code === 'EMAIL_DEACTIVATED') return { skipped: 'email_deactivated' }
    throw err
  }
}

/** After first transition to subscription_status=active. */
export async function sendPurchaseConfirmationEmail(userId) {
  if (!isSmtpReady()) return { skipped: 'smtp' }
  if (!(await isEmailTemplateActive('purchase_success'))) {
    return { skipped: 'email_deactivated' }
  }
  const user = await fetchUser(userId)
  const email = String(user?.email || '').trim()
  if (!email) return { skipped: 'no_email' }

  const mail = buildPurchaseEmail({
    name: user.name || '',
  })
  try {
    const info = await sendMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      title: mail.title,
      ctaLabel: mail.ctaLabel,
      ctaUrl: mail.ctaUrl,
      preheader: mail.preheader,
    })
    return { ok: true, messageId: info.messageId, to: email }
  } catch (err) {
    if (err?.code === 'EMAIL_DEACTIVATED') return { skipped: 'email_deactivated' }
    throw err
  }
}

async function sendBuiltEmail(to, mail) {
  const info = await sendMail({
    to,
    subject: mail.subject,
    text: mail.text,
    title: mail.title,
    ctaLabel: mail.ctaLabel,
    ctaUrl: mail.ctaUrl,
    preheader: mail.preheader,
  })
  return { ok: true, messageId: info.messageId, to }
}

/** Sent once after a gift payment is captured. Each address is independently gated. */
export async function sendGiftEmails(gift, claimTokens) {
  if (!isSmtpReady()) return {}
  const recipientClaimUrl = `https://app.smono.app/claim-gift?token=${encodeURIComponent(claimTokens.recipient)}`
  const sent = {}
  if (!gift.buyer_emailed_at && (await isEmailTemplateActive('gift_buyer'))) {
    const mail = buildGiftBuyerEmail({
      buyerName: gift.buyer_name,
      recipientName: gift.recipient_name,
      recipientEmail: gift.recipient_email,
    })
    await sendBuiltEmail(gift.buyer_email, mail)
    sent.buyer = true
  }
  if (!gift.recipient_emailed_at && (await isEmailTemplateActive('gift_recipient'))) {
    const mail = buildGiftRecipientEmail({
      recipientName: gift.recipient_name,
      buyerName: gift.buyer_name,
      message: gift.message,
      claimUrl: recipientClaimUrl,
    })
    await sendBuiltEmail(gift.recipient_email, mail)
    sent.recipient = true
  }
  return sent
}

/** Daily reminder email (same cadence as push — push is independent). */
export async function sendDailyReminderEmail(userId, quoteBody, reminderTime) {
  if (!isSmtpReady()) return { skipped: 'smtp' }
  if (!(await isEmailTemplateActive('daily_reminder'))) {
    return { skipped: 'email_deactivated' }
  }
  const user = await fetchUser(userId)
  const email = String(user?.email || '').trim()
  if (!email) return { skipped: 'no_email' }

  const mail = buildDailyReminderEmail({
    name: user.name || '',
    quote: quoteBody,
    reminderTime,
  })
  try {
    const info = await sendMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      title: mail.title,
      ctaLabel: mail.ctaLabel,
      ctaUrl: mail.ctaUrl,
      preheader: mail.preheader,
    })
    return { ok: true, messageId: info.messageId, to: email }
  } catch (err) {
    if (err?.code === 'EMAIL_DEACTIVATED') return { skipped: 'email_deactivated' }
    throw err
  }
}
