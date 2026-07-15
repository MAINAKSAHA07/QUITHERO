/**
 * Authenticated support chat API — encrypt at rest, decrypt for callers.
 * Body plaintext never stored in PocketBase.
 */
import { getAuthAdmin, getAuthUser, adminAuth, getPbUrl } from './pb-admin.js'
import {
  decryptSupportText,
  encryptSupportText,
  isSupportCryptoReady,
} from './support-crypto.js'

function cleanAuth(header) {
  return String(header || '')
    .replace(/^Bearer\s+/i, '')
    .trim()
}

async function resolveCaller(authHeader) {
  const token = cleanAuth(authHeader)
  if (!token) return null
  const admin = await getAuthAdmin(token)
  if (admin?.id) return { kind: 'admin', id: admin.id, token }
  const user = await getAuthUser(token)
  if (user?.id) return { kind: 'user', id: user.id, token }
  return null
}

async function pbFetch(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${getPbUrl()}${path}`, {
    method,
    headers: {
      Authorization: token,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }
  return { ok: res.ok, status: res.status, data }
}

async function loadTicket(ticketId, serviceToken) {
  const res = await pbFetch(`/api/collections/support_tickets/records/${ticketId}`, {
    token: serviceToken,
  })
  if (!res.ok) return null
  return res.data
}

function canAccessTicket(caller, ticket) {
  if (!caller || !ticket) return false
  if (caller.kind === 'admin') return true
  return ticket.user === caller.id
}

function decryptMessage(record) {
  return {
    ...record,
    body: decryptSupportText(record.body),
  }
}

export async function handleSupportApi(req, res, pathname, searchParams, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (!isSupportCryptoReady()) {
    return json(res, 503, { error: 'Support chat encryption is not configured' })
  }

  const caller = await resolveCaller(req.headers.authorization)
  if (!caller) return json(res, 401, { error: 'Login required' })

  const serviceToken = await adminAuth()
  if (!serviceToken) return json(res, 503, { error: 'Server cannot reach database admin' })

  // GET /api/support/messages?ticket=
  if (pathname === '/api/support/messages' && req.method === 'GET') {
    const ticketId = String(searchParams.get('ticket') || '').trim()
    if (!ticketId) return json(res, 400, { error: 'ticket required' })

    const ticket = await loadTicket(ticketId, serviceToken)
    if (!ticket || !canAccessTicket(caller, ticket)) {
      return json(res, 403, { error: 'Forbidden' })
    }

    const filter = encodeURIComponent(`ticket = "${ticketId}"`)
    const list = await pbFetch(
      `/api/collections/support_ticket_messages/records?filter=${filter}&sort=created&perPage=200`,
      { token: serviceToken }
    )
    if (!list.ok) {
      return json(res, list.status, { error: list.data?.message || 'Failed to load messages' })
    }
    const items = (list.data?.items || []).map(decryptMessage)
    return json(res, 200, { ok: true, data: items })
  }

  // POST /api/support/messages
  if (pathname === '/api/support/messages' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }

    const ticketId = String(body.ticket || '').trim()
    const text = String(body.body || '').trim()
    if (!ticketId || !text) return json(res, 400, { error: 'ticket and body required' })

    const ticket = await loadTicket(ticketId, serviceToken)
    if (!ticket || !canAccessTicket(caller, ticket)) {
      return json(res, 403, { error: 'Forbidden' })
    }

    const sender_role = caller.kind === 'admin' ? 'admin' : 'user'
    if (body.sender_role && body.sender_role !== sender_role) {
      return json(res, 403, { error: 'Invalid sender_role' })
    }

    const created = await pbFetch(`/api/collections/support_ticket_messages/records`, {
      method: 'POST',
      token: serviceToken,
      body: {
        ticket: ticketId,
        body: encryptSupportText(text),
        sender_role,
        author_id: caller.id,
      },
    })
    if (!created.ok) {
      return json(res, created.status, {
        error: created.data?.message || 'Failed to send message',
      })
    }

    if (caller.kind === 'admin' && ticket.status === 'open') {
      await pbFetch(`/api/collections/support_tickets/records/${ticketId}`, {
        method: 'PATCH',
        token: serviceToken,
        body: { status: 'in_progress' },
      })
    }

    return json(res, 200, { ok: true, data: decryptMessage(created.data) })
  }

  // POST /api/support/tickets — create ticket + encrypted first message
  if (pathname === '/api/support/tickets' && req.method === 'POST') {
    if (caller.kind !== 'user') {
      return json(res, 403, { error: 'Only app users can open tickets' })
    }
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }

    const subject = String(body.subject || '').trim()
    const text = String(body.message || body.description || '').trim()
    if (!subject || !text) return json(res, 400, { error: 'subject and message required' })

    // Keep subject searchable; store no plaintext body on the ticket row
    const ticketRes = await pbFetch(`/api/collections/support_tickets/records`, {
      method: 'POST',
      token: caller.token,
      body: {
        user: caller.id,
        subject,
        message: '',
        description: '',
        status: 'open',
        priority: body.priority || 'medium',
        category: body.category || 'other',
      },
    })
    if (!ticketRes.ok) {
      return json(res, ticketRes.status, {
        error: ticketRes.data?.message || 'Failed to create ticket',
      })
    }

    const msgRes = await pbFetch(`/api/collections/support_ticket_messages/records`, {
      method: 'POST',
      token: serviceToken,
      body: {
        ticket: ticketRes.data.id,
        body: encryptSupportText(text),
        sender_role: 'user',
        author_id: caller.id,
      },
    })
    if (!msgRes.ok) {
      return json(res, msgRes.status, {
        error: msgRes.data?.message || 'Ticket created but first message failed',
        data: ticketRes.data,
      })
    }

    return json(res, 200, {
      ok: true,
      data: ticketRes.data,
      message: decryptMessage(msgRes.data),
    })
  }

  return json(res, 404, { error: 'not_found' })
}
