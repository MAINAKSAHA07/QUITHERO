/**
 * Admin delete user — prefers server API (SMTP on EC2), falls back to client purge.
 */
import { pb, adminCollectionHelpers } from './pocketbase'
import { appApiBase, sendAdminEmail } from './sendEmail'
import { buildDeletionAcceptedEmail } from './deletionEmail'

const CONTACT_RETAIN_DAYS = 30

const USER_OWNED_COLLECTIONS = [
  'user_profiles',
  'progress_stats',
  'user_sessions',
  'session_progress',
  'step_responses',
  'cravings',
  'journal_entries',
  'user_achievements',
  'belief_assessments',
  'smoke_check_ins',
  'analytics_events',
  'push_subscriptions',
  'notification_events',
  'user_behavior_profiles',
  'session_ai_memory',
  'personalization_logs',
  'technique_outcomes',
  'support_tickets',
  'payment_events',
  'coach_messages',
  'coach_sessions',
] as const

export type DeleteUserOptions = {
  notify?: boolean
  adminNotes?: string
}

function authHeaders(): HeadersInit | null {
  const token = pb.authStore.token
  if (!token) return null
  return {
    'Content-Type': 'application/json',
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
  }
}

function deleteUrl(): string {
  const base = appApiBase()
  if (base) return `${base}/api/admin/delete-user`
  // Admin nginx may not have /api/admin/* yet — hit app host (CORS *)
  if (typeof window !== 'undefined' && /admin\.smono\.app$/i.test(window.location.hostname)) {
    return 'https://app.smono.app/api/admin/delete-user'
  }
  return '/api/admin/delete-user'
}

async function deleteByFilter(collection: string, filter: string): Promise<number> {
  try {
    const rows = await pb.collection(collection).getFullList({ filter, fields: 'id', batch: 200 })
    let n = 0
    for (const row of rows) {
      await pb.collection(collection).delete(row.id)
      n++
    }
    return n
  } catch {
    return 0
  }
}

async function deleteSupportTicketsForUser(userId: string): Promise<void> {
  try {
    const tickets = await pb.collection('support_tickets').getFullList({
      filter: `user = "${userId}"`,
      fields: 'id',
      batch: 200,
    })
    for (const ticket of tickets) {
      await deleteByFilter('support_ticket_messages', `ticket = "${ticket.id}"`)
      await pb.collection('support_tickets').delete(ticket.id)
    }
  } catch {
    /* optional */
  }
}

type ContactSnapshot = { email: string; name: string; phone: string }

async function loadContactSnapshot(userId: string): Promise<ContactSnapshot> {
  let email = ''
  let name = ''
  let phone = ''
  try {
    const user = await pb.collection('users').getOne(userId, { fields: 'id,email,name' })
    email = String(user.email || '').trim()
    name = String(user.name || '').trim()
  } catch {
    /* gone */
  }
  try {
    const profiles = await pb.collection('user_profiles').getFullList({
      filter: `user = "${userId}"`,
      fields: 'phone,onboarding_name',
      batch: 1,
    })
    const p = profiles[0] as { phone?: string; onboarding_name?: string } | undefined
    if (p?.phone) phone = String(p.phone).trim()
    if (!name && p?.onboarding_name) name = String(p.onboarding_name).trim()
  } catch {
    /* optional */
  }
  return { email, name, phone }
}

function retainUntilIso(from = new Date()): string {
  const d = new Date(from)
  d.setUTCDate(d.getUTCDate() + CONTACT_RETAIN_DAYS)
  return d.toISOString()
}

async function retainContactAfterDeletion(
  userId: string,
  contact: ContactSnapshot,
  adminNotes?: string
): Promise<void> {
  const now = new Date().toISOString()
  const retain_until = retainUntilIso()
  const basePayload: Record<string, string> = {
    status: 'completed',
    processed_at: now,
    retain_until,
    admin_notes: [
      adminNotes?.trim() || '',
      contact.email ? `Deleted account: ${contact.email}` : '',
      `Contact retained until ${retain_until.slice(0, 10)}`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
  if (contact.email) basePayload.contact_email = contact.email
  if (contact.name) basePayload.contact_name = contact.name
  if (contact.phone) basePayload.contact_phone = contact.phone

  try {
    const pending = await pb.collection('account_deletion_requests').getFullList({
      filter: `user = "${userId}"`,
      fields: 'id,status',
      batch: 50,
    })
    if (pending.length) {
      for (const row of pending) {
        await pb.collection('account_deletion_requests').update(row.id, {
          ...basePayload,
          user: null,
        })
      }
      return
    }
  } catch {
    /* try create */
  }

  try {
    await pb.collection('account_deletion_requests').create({
      ...basePayload,
      reason: 'Admin deleted account',
    })
  } catch (err) {
    console.warn('[deleteUser] contact retention failed:', err)
  }
}

/** Drop completed rows whose retain_until has passed. */
export async function purgeExpiredDeletionContacts(): Promise<number> {
  const now = new Date().toISOString()
  try {
    const rows = await pb.collection('account_deletion_requests').getFullList({
      filter: `status = "completed" && retain_until != "" && retain_until < "${now}"`,
      fields: 'id',
      batch: 200,
    })
    let n = 0
    for (const row of rows) {
      await pb.collection('account_deletion_requests').delete(row.id)
      n++
    }
    return n
  } catch {
    return 0
  }
}

/** Client-side purge — used only when server delete API is not deployed yet. */
async function deleteUserClientSide(
  userId: string,
  options: DeleteUserOptions
): Promise<{ success: boolean; error?: string; emailSent?: boolean; emailError?: string }> {
  const notify = options.notify !== false
  let emailSent = false
  let emailError: string | undefined
  const contact = await loadContactSnapshot(userId)

  if (notify && contact.email) {
    const mail = buildDeletionAcceptedEmail({ name: contact.name })
    const sent = await sendAdminEmail({
      to: contact.email,
      subject: mail.subject,
      text: mail.text,
      title: mail.title,
      ctaLabel: mail.ctaLabel,
      ctaUrl: mail.ctaUrl,
      preheader: mail.preheader,
    })
    emailSent = sent.ok
    if (!sent.ok) emailError = sent.error || 'Acceptance email failed'
  } else if (notify && !contact.email) {
    emailError = 'User has no email on file — acceptance email skipped'
  }

  await retainContactAfterDeletion(userId, contact, options.adminNotes)

  try {
    const assigned = await pb.collection('support_tickets').getFullList({
      filter: `assigned_to = "${userId}"`,
      fields: 'id',
      batch: 200,
    })
    for (const row of assigned) {
      await pb.collection('support_tickets').update(row.id, { assigned_to: null })
    }
  } catch {
    /* optional */
  }

  await deleteSupportTicketsForUser(userId)
  for (const collection of USER_OWNED_COLLECTIONS) {
    if (collection === 'support_tickets') continue
    await deleteByFilter(collection, `user = "${userId}"`)
  }

  try {
    const leftover = await pb.collection('account_deletion_requests').getFullList({
      filter: `user = "${userId}"`,
      fields: 'id',
      batch: 50,
    })
    for (const row of leftover) {
      await pb.collection('account_deletion_requests').update(row.id, { user: null })
    }
  } catch {
    /* optional */
  }

  const result = await adminCollectionHelpers.delete('users', userId)
  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to delete user',
      emailSent,
      emailError,
    }
  }
  return { success: true, emailSent, emailError }
}

/**
 * Delete user: server SMTP path first, client fallback if API not deployed.
 */
export async function deleteUserAndRelated(
  userId: string,
  options: DeleteUserOptions = {}
): Promise<{ success: boolean; error?: string; emailSent?: boolean; emailError?: string }> {
  if (!userId) return { success: false, error: 'Missing user id' }

  const headers = authHeaders()
  if (!headers) return { success: false, error: 'Admin session expired. Sign in again.' }

  try {
    const res = await fetch(deleteUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        adminNotes: options.adminNotes || '',
        notify: options.notify !== false,
      }),
    })
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    const html = ct.includes('text/html')
    // 404/405/HTML → route missing on this host; fall back
    if (html || res.status === 404 || res.status === 405) {
      console.warn('[deleteUser] server delete unavailable, using client fallback', res.status)
      return deleteUserClientSide(userId, options)
    }
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      emailSent?: boolean
      emailError?: string
    }
    if (!res.ok || data.ok === false) {
      return {
        success: false,
        error: data.error || `Delete failed (${res.status})`,
        emailSent: data.emailSent,
        emailError: data.emailError,
      }
    }
    return {
      success: true,
      emailSent: Boolean(data.emailSent),
      emailError: data.emailError,
    }
  } catch {
    console.warn('[deleteUser] server delete unreachable, using client fallback')
    return deleteUserClientSide(userId, options)
  }
}
