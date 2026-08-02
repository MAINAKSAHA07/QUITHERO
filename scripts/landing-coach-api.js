/**
 * Landing guest coach — 10 user messages, same AI voice as in-app coach.
 * Persists threads in landing_coach_chats (admin-only collection).
 */
import { adminAuth, getPbUrl } from './pb-admin.js'
import aiHandler from '../netlify/functions/ai-personalize.js'

export const LANDING_COACH_USER_LIMIT = 10

const GUEST_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/

function isValidGuestId(id) {
  return GUEST_ID_RE.test(String(id || ''))
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

function normalizeMessages(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && String(m.body || '').trim())
    .map((m) => ({
      role: m.role,
      body: String(m.body).slice(0, 4000),
      at: m.at || undefined,
    }))
    .slice(-40)
}

export function remainingUserMessages(count) {
  const n = Math.max(0, Number(count) || 0)
  return Math.max(0, LANDING_COACH_USER_LIMIT - n)
}

async function loadThread(guestId, token) {
  const filter = encodeURIComponent(`guest_id = "${guestId.replace(/"/g, '')}"`)
  const res = await pbFetch(
    `/api/collections/landing_coach_chats/records?filter=${filter}&perPage=1`,
    { token }
  )
  if (!res.ok) return { ok: false, status: res.status, error: res.data?.message || 'Load failed' }
  return { ok: true, row: res.data?.items?.[0] || null }
}

async function ensureThread(guestId, page, token) {
  const loaded = await loadThread(guestId, token)
  if (!loaded.ok) return loaded
  if (loaded.row) return { ok: true, row: loaded.row }

  const created = await pbFetch(`/api/collections/landing_coach_chats/records`, {
    method: 'POST',
    token,
    body: {
      guest_id: guestId,
      messages: [],
      user_message_count: 0,
      page: String(page || '').slice(0, 64),
    },
  })
  if (!created.ok) {
    return {
      ok: false,
      status: created.status,
      error: created.data?.message || 'Create failed',
      details: created.data?.data || created.data,
    }
  }
  return { ok: true, row: created.data }
}

function threadPayload(row) {
  const messages = normalizeMessages(row?.messages)
  const userMessageCount = Math.max(0, Number(row?.user_message_count) || 0)
  const remaining = remainingUserMessages(userMessageCount)
  return {
    guestId: row?.guest_id,
    messages,
    userMessageCount,
    remaining,
    limitReached: remaining <= 0,
    limit: LANDING_COACH_USER_LIMIT,
  }
}

async function callLandingCoachAi({ guestId, messages, latestUserMessage, languageCode, languageName }) {
  const learningBits = [
    'Landing page visitor. No program account or KYC yet.',
    'Same tone rules as the in-app quit coach.',
    'If they want deeper help, gently mention unlocking the full Smono program — never hard-sell every reply.',
  ]
  const userCount = messages.filter((m) => m.role === 'user').length
  if (userCount >= 7) {
    learningBits.push(
      'They are near the free chat limit. If natural, mention buying/unlocking Smono for ongoing coach support.'
    )
  }

  const body = {
    userId: `guest:${guestId}`,
    requestType: 'landing_coach_chat',
    context: {
      dayNumber: 1,
      languageCode: languageCode || 'en',
      languageName: languageName || 'English',
      learningContext: learningBits.join(' '),
      latestUserMessage,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.body,
      })),
    },
  }

  const request = new Request('http://127.0.0.1/api/ai/personalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const response = await aiHandler(request)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(data.error || data.details || 'AI unavailable')
    err.status = response.status
    throw err
  }
  return String(data.reply || '').trim()
}

export async function handleLandingCoachApi(req, res, pathname, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  const token = await adminAuth()
  if (!token) return json(res, 503, { error: 'Database unavailable' })

  // GET /api/landing-coach/session?guest_id=
  if (pathname === '/api/landing-coach/session' && req.method === 'GET') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const guestId = String(url.searchParams.get('guest_id') || '').trim()
    if (!isValidGuestId(guestId)) return json(res, 400, { error: 'Invalid guest_id' })
    const page = String(url.searchParams.get('page') || '').slice(0, 64)
    const ensured = await ensureThread(guestId, page, token)
    if (!ensured.ok) {
      return json(res, ensured.status || 500, {
        error: ensured.error,
        details: ensured.details,
      })
    }
    return json(res, 200, { ok: true, ...threadPayload(ensured.row) })
  }

  // POST /api/landing-coach/message
  if (pathname === '/api/landing-coach/message' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }

    const guestId = String(body.guest_id || '').trim()
    if (!isValidGuestId(guestId)) return json(res, 400, { error: 'Invalid guest_id' })
    const text = String(body.body || '').trim().slice(0, 2000)
    if (!text) return json(res, 400, { error: 'Message required' })
    const page = String(body.page || '').slice(0, 64)
    const languageCode = String(body.languageCode || 'en').slice(0, 8)
    const languageName = String(body.languageName || 'English').slice(0, 40)

    const ensured = await ensureThread(guestId, page, token)
    if (!ensured.ok) return json(res, ensured.status || 500, { error: ensured.error })
    const row = ensured.row
    const messages = normalizeMessages(row.messages)
    const userMessageCount = Math.max(0, Number(row.user_message_count) || 0)

    if (userMessageCount >= LANDING_COACH_USER_LIMIT) {
      return json(res, 200, {
        ok: true,
        limitReached: true,
        ...threadPayload(row),
        upsell:
          'You’ve used your 10 free coach messages. Unlock Smono for deeper, ongoing quit support.',
      })
    }

    const now = new Date().toISOString()
    const withUser = [...messages, { role: 'user', body: text, at: now }]
    const nextCount = userMessageCount + 1

    let reply =
      "I'm here with you. Take one slow breath. We can take the next step together whenever you're ready."
    try {
      reply =
        (await callLandingCoachAi({
          guestId,
          messages: withUser,
          latestUserMessage: text,
          languageCode,
          languageName,
        })) || reply
    } catch (err) {
      console.error('[landing-coach]', err?.message || err)
      if (err?.status === 429) {
        return json(res, 429, { error: 'Too many messages right now. Try again shortly.' })
      }
    }

    if (nextCount >= LANDING_COACH_USER_LIMIT) {
      reply = `${reply} You've used your 10 free messages — unlock Smono for ongoing coach support.`
    }

    const withAssistant = [
      ...withUser,
      { role: 'assistant', body: reply, at: new Date().toISOString() },
    ]

    const patch = await pbFetch(`/api/collections/landing_coach_chats/records/${row.id}`, {
      method: 'PATCH',
      token,
      body: {
        messages: withAssistant,
        user_message_count: nextCount,
        ...(page ? { page } : {}),
      },
    })
    if (!patch.ok) {
      return json(res, patch.status, { error: patch.data?.message || 'Could not save chat' })
    }

    const payload = threadPayload(patch.data)
    return json(res, 200, {
      ok: true,
      reply,
      ...payload,
      upsell: payload.limitReached
        ? 'You’ve used your 10 free coach messages. Unlock Smono for deeper, ongoing quit support.'
        : undefined,
    })
  }

  return json(res, 404, { error: 'not_found' })
}
