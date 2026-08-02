/**
 * Admin delete user — SMTP acceptance email + 30-day contact retention + purge.
 * POST /api/admin/delete-user { userId, adminNotes? }
 *
 * Runs on the API server so email doesn't depend on the browser → /api/email path.
 */
import { getAuthAdmin, adminAuth, getPbUrl } from './pb-admin.js'
import { isSmtpReady, sendMail } from './mail.js'
import { buildDeletionAcceptedEmail } from './email-templates.js'

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
  'payment_events',
  'coach_messages',
  'coach_sessions',
]

function bearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || ''
  const m = String(h).match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : String(h).trim()
}

async function readJson(req, readBody) {
  const buf = await readBody(req)
  if (!buf?.length) return {}
  try {
    return JSON.parse(buf.toString('utf8'))
  } catch {
    return null
  }
}

async function pbFetch(path, { method = 'GET', body } = {}) {
  const token = await adminAuth()
  if (!token) throw new Error('Admin auth unavailable')
  const res = await fetch(`${getPbUrl()}${path}`, {
    method,
    headers: {
      Authorization: token,
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const text = await res.text().catch(() => '')
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  return { ok: res.ok, status: res.status, data }
}

async function deleteByFilter(collection, filter) {
  const q = encodeURIComponent(filter)
  const list = await pbFetch(
    `/api/collections/${collection}/records?filter=${q}&perPage=200&fields=id`
  )
  if (!list.ok) return 0
  let n = 0
  for (const row of list.data?.items || []) {
    const del = await pbFetch(`/api/collections/${collection}/records/${row.id}`, {
      method: 'DELETE',
    })
    if (del.ok) n++
  }
  return n
}

async function loadContact(userId) {
  const userRes = await pbFetch(`/api/collections/users/records/${userId}?fields=id,email,name`)
  const email = String(userRes.data?.email || '').trim()
  let name = String(userRes.data?.name || '').trim()
  let phone = ''
  const filter = encodeURIComponent(`user = "${userId}"`)
  const profiles = await pbFetch(
    `/api/collections/user_profiles/records?filter=${filter}&perPage=1&fields=phone,onboarding_name`
  )
  const p = profiles.data?.items?.[0]
  if (p?.phone) phone = String(p.phone).trim()
  if (!name && p?.onboarding_name) name = String(p.onboarding_name).trim()
  return { email, name, phone }
}

function retainUntilIso() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + CONTACT_RETAIN_DAYS)
  return d.toISOString()
}

async function retainContact(userId, contact, adminNotes) {
  const now = new Date().toISOString()
  const retain_until = retainUntilIso()
  const payload = {
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
    reason: 'Admin deleted account',
  }
  if (contact.email) payload.contact_email = contact.email
  if (contact.name) payload.contact_name = contact.name
  if (contact.phone) payload.contact_phone = contact.phone

  const filter = encodeURIComponent(`user = "${userId}"`)
  const existing = await pbFetch(
    `/api/collections/account_deletion_requests/records?filter=${filter}&perPage=50&fields=id`
  )
  if (existing.ok && existing.data?.items?.length) {
    for (const row of existing.data.items) {
      await pbFetch(`/api/collections/account_deletion_requests/records/${row.id}`, {
        method: 'PATCH',
        body: { ...payload, user: null },
      })
    }
    return
  }

  await pbFetch(`/api/collections/account_deletion_requests/records`, {
    method: 'POST',
    body: payload,
  })
}

async function deleteSupportTickets(userId) {
  const filter = encodeURIComponent(`user = "${userId}"`)
  const list = await pbFetch(
    `/api/collections/support_tickets/records?filter=${filter}&perPage=200&fields=id`
  )
  for (const ticket of list.data?.items || []) {
    await deleteByFilter('support_ticket_messages', `ticket = "${ticket.id}"`)
    await pbFetch(`/api/collections/support_tickets/records/${ticket.id}`, { method: 'DELETE' })
  }
}

async function purgeUser(userId) {
  // Clear assigned_to reverse refs
  const assignedFilter = encodeURIComponent(`assigned_to = "${userId}"`)
  const assigned = await pbFetch(
    `/api/collections/support_tickets/records?filter=${assignedFilter}&perPage=200&fields=id`
  )
  for (const row of assigned.data?.items || []) {
    await pbFetch(`/api/collections/support_tickets/records/${row.id}`, {
      method: 'PATCH',
      body: { assigned_to: null },
    })
  }

  await deleteSupportTickets(userId)

  for (const collection of USER_OWNED_COLLECTIONS) {
    await deleteByFilter(collection, `user = "${userId}"`)
  }

  const leftoverFilter = encodeURIComponent(`user = "${userId}"`)
  const leftover = await pbFetch(
    `/api/collections/account_deletion_requests/records?filter=${leftoverFilter}&perPage=50&fields=id`
  )
  for (const row of leftover.data?.items || []) {
    await pbFetch(`/api/collections/account_deletion_requests/records/${row.id}`, {
      method: 'PATCH',
      body: { user: null },
    })
  }

  const del = await pbFetch(`/api/collections/users/records/${userId}`, { method: 'DELETE' })
  if (!del.ok) {
    throw new Error(del.data?.message || `Failed to delete user (${del.status})`)
  }
}

/**
 * Send acceptance email — transactional, not gated by marketing kill-switch.
 */
export async function sendDeletionAcceptedMail(contact) {
  const email = String(contact?.email || '').trim()
  if (!email) return { skipped: 'no_email' }
  if (!isSmtpReady()) return { skipped: 'smtp' }

  const mail = buildDeletionAcceptedEmail({ name: contact.name || '' })
  const info = await sendMail({
    to: email,
    subject: mail.subject,
    text: mail.text,
    title: mail.title,
    ctaLabel: mail.ctaLabel,
    ctaUrl: mail.ctaUrl,
    preheader: mail.preheader,
    bypassEmailKillSwitch: true,
  })
  return { ok: true, messageId: info.messageId, to: email }
}

export async function handleAdminDeleteUserApi(req, res, pathname, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (pathname !== '/api/admin/delete-user' || req.method !== 'POST') {
    json(res, 404, { error: 'not_found' })
    return
  }

  const admin = await getAuthAdmin(bearer(req))
  if (!admin?.id) {
    json(res, 401, { error: 'unauthorized' })
    return
  }

  const body = await readJson(req, readBody)
  if (!body) {
    json(res, 400, { error: 'invalid_json' })
    return
  }

  const userId = String(body.userId || '').trim()
  if (!userId) {
    json(res, 400, { error: 'userId_required' })
    return
  }

  const adminNotes = body.adminNotes != null ? String(body.adminNotes) : ''

  try {
    const contact = await loadContact(userId)
    if (!contact.email && !(await pbFetch(`/api/collections/users/records/${userId}?fields=id`)).ok) {
      json(res, 404, { error: 'user_not_found' })
      return
    }

    let emailSent = false
    let emailError
    const notify = body.notify !== false
    if (notify) {
      try {
        const sent = await sendDeletionAcceptedMail(contact)
        if (sent.ok) emailSent = true
        else emailError = sent.skipped || 'email_skipped'
      } catch (err) {
        emailError = err?.message || 'email_failed'
        console.error('[admin-delete-user] email', emailError)
      }
    } else {
      emailError = 'notify_disabled'
    }

    await retainContact(userId, contact, adminNotes)
    await purgeUser(userId)

    console.error(
      `[admin-delete-user] user=${userId} email=${contact.email || 'none'} sent=${emailSent} by=${admin.email || admin.id}`
    )
    json(res, 200, {
      ok: true,
      emailSent,
      emailError: emailSent ? undefined : emailError,
      contactEmail: contact.email || undefined,
    })
  } catch (err) {
    console.error('[admin-delete-user]', err?.message || err)
    json(res, 500, { error: err?.message || 'delete_failed' })
  }
}
