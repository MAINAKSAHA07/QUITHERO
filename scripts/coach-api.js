/**
 * Coach chat API — session mode, human takeover, admin replies.
 * AI turns go through /api/ai/personalize (coach_chat) after gates here.
 */
import { getAuthAdmin, getAuthUser, adminAuth, getPbUrl } from './pb-admin.js'
import { isPushReady, notifyUserPush } from './push.js'

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

export async function loadCoachProfileFlag(userId, serviceToken) {
  const filter = encodeURIComponent(`user = "${userId}"`)
  const res = await pbFetch(
    `/api/collections/user_profiles/records?filter=${filter}&perPage=1&fields=id,enable_coach_chat`,
    { token: serviceToken }
  )
  if (!res.ok) return { enabled: false, profile: null }
  const row = res.data?.items?.[0]
  return { enabled: !!row?.enable_coach_chat, profile: row || null }
}

export async function loadOpenCoachSession(userId, serviceToken) {
  const filter = encodeURIComponent(`user = "${userId}" && status = "open"`)
  const res = await pbFetch(
    `/api/collections/coach_sessions/records?filter=${filter}&sort=-updated&perPage=1`,
    { token: serviceToken }
  )
  if (!res.ok) return null
  return res.data?.items?.[0] || null
}

async function ensureOpenSession(userId, serviceToken) {
  const existing = await loadOpenCoachSession(userId, serviceToken)
  if (existing) return existing
  const created = await pbFetch(`/api/collections/coach_sessions/records`, {
    method: 'POST',
    token: serviceToken,
    body: { user: userId, mode: 'ai', status: 'open' },
  })
  return created.ok ? created.data : null
}

async function postMessage({ userId, sessionId, role, body, token }) {
  return pbFetch(`/api/collections/coach_messages/records`, {
    method: 'POST',
    token,
    body: { user: userId, session: sessionId, role, body },
  })
}

export async function handleCoachApi(req, res, pathname, searchParams, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  const caller = await resolveCaller(req.headers.authorization)
  if (!caller) return json(res, 401, { error: 'Login required' })

  const serviceToken = await adminAuth()
  if (!serviceToken) return json(res, 503, { error: 'Server cannot reach database admin' })

  // GET /api/coach/session
  if (pathname === '/api/coach/session' && req.method === 'GET') {
    const targetUser =
      caller.kind === 'admin'
        ? String(searchParams.get('userId') || '').trim()
        : caller.id
    if (!targetUser) return json(res, 400, { error: 'userId required' })
    if (caller.kind === 'user' && targetUser !== caller.id) {
      return json(res, 403, { error: 'Forbidden' })
    }

    const { enabled } = await loadCoachProfileFlag(targetUser, serviceToken)
    if (!enabled && caller.kind === 'user') {
      return json(res, 403, { error: 'Coach not enabled for this account' })
    }

    const session = await ensureOpenSession(targetUser, serviceToken)
    if (!session) return json(res, 500, { error: 'Could not open coach session' })

    const filter = encodeURIComponent(`session = "${session.id}"`)
    const msgs = await pbFetch(
      `/api/collections/coach_messages/records?filter=${filter}&sort=created&perPage=100`,
      { token: serviceToken }
    )
    return json(res, 200, {
      ok: true,
      session,
      messages: msgs.ok ? msgs.data?.items || [] : [],
    })
  }

  // POST /api/coach/request-human
  if (pathname === '/api/coach/request-human' && req.method === 'POST') {
    if (caller.kind !== 'user') return json(res, 403, { error: 'Users only' })
    const { enabled } = await loadCoachProfileFlag(caller.id, serviceToken)
    if (!enabled) return json(res, 403, { error: 'Coach not enabled' })

    const session = await ensureOpenSession(caller.id, serviceToken)
    if (!session) return json(res, 500, { error: 'No session' })

    await pbFetch(`/api/collections/coach_sessions/records/${session.id}`, {
      method: 'PATCH',
      token: serviceToken,
      body: { mode: 'human' },
    })

    await postMessage({
      userId: caller.id,
      sessionId: session.id,
      role: 'assistant',
      body: 'A specialist will join this chat shortly. The AI Coach is paused for now.',
      token: serviceToken,
    })

    return json(res, 200, { ok: true, mode: 'human', sessionId: session.id })
  }

  // POST /api/coach/claim
  if (pathname === '/api/coach/claim' && req.method === 'POST') {
    if (caller.kind !== 'admin') return json(res, 403, { error: 'Admin only' })
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    const sessionId = String(body.sessionId || '').trim()
    if (!sessionId) return json(res, 400, { error: 'sessionId required' })

    const patch = await pbFetch(`/api/collections/coach_sessions/records/${sessionId}`, {
      method: 'PATCH',
      token: serviceToken,
      body: {
        mode: 'human',
        claimed_by: caller.id,
        claimed_at: new Date().toISOString(),
        status: 'open',
      },
    })
    if (!patch.ok) return json(res, patch.status, { error: patch.data?.message || 'Claim failed' })
    return json(res, 200, { ok: true, session: patch.data })
  }

  // POST /api/coach/release — return to AI
  if (pathname === '/api/coach/release' && req.method === 'POST') {
    if (caller.kind !== 'admin') return json(res, 403, { error: 'Admin only' })
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    const sessionId = String(body.sessionId || '').trim()
    if (!sessionId) return json(res, 400, { error: 'sessionId required' })

    const sess = await pbFetch(`/api/collections/coach_sessions/records/${sessionId}`, {
      token: serviceToken,
    })
    if (!sess.ok) return json(res, 404, { error: 'Session not found' })

    const patch = await pbFetch(`/api/collections/coach_sessions/records/${sessionId}`, {
      method: 'PATCH',
      token: serviceToken,
      body: { mode: 'ai', claimed_by: null, claimed_at: null },
    })
    if (!patch.ok) return json(res, patch.status, { error: 'Release failed' })

    const userId = typeof sess.data.user === 'string' ? sess.data.user : sess.data.user?.id
    if (userId) {
      await postMessage({
        userId,
        sessionId,
        role: 'assistant',
        body: 'Your specialist has stepped back. I’m here again whenever you need me.',
        token: serviceToken,
      })
    }
    return json(res, 200, { ok: true, mode: 'ai' })
  }

  // POST /api/coach/messages — user or admin human reply
  if (pathname === '/api/coach/messages' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    const text = String(body.body || '').trim().slice(0, 4000)
    if (!text) return json(res, 400, { error: 'body required' })

    if (caller.kind === 'user') {
      const { enabled } = await loadCoachProfileFlag(caller.id, serviceToken)
      if (!enabled) return json(res, 403, { error: 'Coach not enabled' })
      const session = await ensureOpenSession(caller.id, serviceToken)
      if (!session) return json(res, 500, { error: 'No session' })
      const created = await postMessage({
        userId: caller.id,
        sessionId: session.id,
        role: 'user',
        body: text,
        token: serviceToken,
      })
      if (!created.ok) {
        return json(res, created.status, { error: created.data?.message || 'Send failed' })
      }
      return json(res, 200, {
        ok: true,
        message: created.data,
        session,
        needsAi: session.mode !== 'human',
      })
    }

    // admin human reply
    const sessionId = String(body.sessionId || '').trim()
    if (!sessionId) return json(res, 400, { error: 'sessionId required' })
    const sess = await pbFetch(`/api/collections/coach_sessions/records/${sessionId}`, {
      token: serviceToken,
    })
    if (!sess.ok) return json(res, 404, { error: 'Session not found' })
    const userId = typeof sess.data.user === 'string' ? sess.data.user : sess.data.user?.id
    if (!userId) return json(res, 400, { error: 'Session has no user' })

    if (sess.data.mode !== 'human') {
      await pbFetch(`/api/collections/coach_sessions/records/${sessionId}`, {
        method: 'PATCH',
        token: serviceToken,
        body: {
          mode: 'human',
          claimed_by: caller.id,
          claimed_at: new Date().toISOString(),
        },
      })
    }

    const created = await postMessage({
      userId,
      sessionId,
      role: 'human',
      body: text,
      token: serviceToken,
    })
    if (!created.ok) {
      return json(res, created.status, { error: created.data?.message || 'Send failed' })
    }

    if (isPushReady()) {
      void notifyUserPush(userId, {
        title: 'Specialist replied',
        body: text.slice(0, 120),
        url: '/coach',
        tag: `coach-${sessionId}`,
      }).catch(() => null)
    }

    return json(res, 200, { ok: true, message: created.data })
  }

  // GET /api/coach/inbox — admin list human-mode sessions
  if (pathname === '/api/coach/inbox' && req.method === 'GET') {
    if (caller.kind !== 'admin') return json(res, 403, { error: 'Admin only' })
    const filter = encodeURIComponent(`status = "open" && mode = "human"`)
    const list = await pbFetch(
      `/api/collections/coach_sessions/records?filter=${filter}&sort=-updated&perPage=50&expand=user`,
      { token: serviceToken }
    )
    if (!list.ok) return json(res, list.status, { error: 'Failed to list' })
    return json(res, 200, { ok: true, items: list.data?.items || [] })
  }

  return json(res, 404, { error: 'not_found' })
}

/** Gate for AI coach_chat: returns null if OK, or { status, error }. */
export async function gateCoachAiTurn(userId, authHeader) {
  const caller = await resolveCaller(authHeader)
  if (!caller || caller.kind !== 'user' || caller.id !== userId) {
    return { status: 401, error: 'User login required' }
  }
  const serviceToken = await adminAuth()
  if (!serviceToken) return { status: 503, error: 'Database unavailable' }

  const { enabled } = await loadCoachProfileFlag(userId, serviceToken)
  if (!enabled) return { status: 403, error: 'Coach not enabled for this account' }

  const session = await loadOpenCoachSession(userId, serviceToken)
  if (session?.mode === 'human') {
    return { status: 409, error: 'Specialist connected — AI paused' }
  }
  return null
}
