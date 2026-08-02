import { pb } from '../lib/pocketbase'
import { apiUrl } from '../utils/apiOrigin'
import { buildCoachLearningContext } from './coach-context.service'
import { getLanguageDisplayName } from '../constants/languages'
import { cleanCoachReplyClient } from '../utils/coachHumanPace'
import type { UserProfile } from '../types/models'

export type CoachMessage = {
  id: string
  user: string
  session: string
  role: 'user' | 'assistant' | 'human'
  body: string
  created?: string
}

export type CoachSession = {
  id: string
  user: string
  mode: 'ai' | 'human'
  status: 'open' | 'closed'
  claimed_by?: string
  claimed_at?: string
}

/** PocketBase-direct coach CRUD — works even when /api/coach nginx proxy isn't deployed yet. */
async function ensureOpenSession(userId: string): Promise<CoachSession> {
  try {
    const existing = await pb.collection('coach_sessions').getFirstListItem(
      `user = "${userId}" && status = "open"`
    )
    return existing as unknown as CoachSession
  } catch {
    const created = await pb.collection('coach_sessions').create({
      user: userId,
      mode: 'ai',
      status: 'open',
    })
    return created as unknown as CoachSession
  }
}

export async function loadCoachSession(): Promise<
  | { ok: true; data: { session: CoachSession; messages: CoachMessage[] } }
  | { ok: false; error: string; status?: number }
> {
  const userId = pb.authStore.record?.id
  if (!userId || !pb.authStore.isValid) {
    return { ok: false, error: 'Sign in required', status: 401 }
  }
  try {
    const session = await ensureOpenSession(userId)
    const rows = await pb.collection('coach_messages').getList(1, 100, {
      filter: `session = "${session.id}"`,
      sort: 'created',
    })
    return {
      ok: true,
      data: {
        session,
        messages: rows.items as unknown as CoachMessage[],
      },
    }
  } catch (e: any) {
    const status = e?.status || e?.response?.status
    if (status === 404 || String(e?.message || '').includes('Missing collection')) {
      return { ok: false, error: 'Coach is not set up yet. Ask admin to enable collections.', status: 503 }
    }
    return { ok: false, error: e?.message || 'Could not load coach', status }
  }
}

export async function requestHumanSpecialist(): Promise<
  | { ok: true; data: { mode: string; sessionId: string } }
  | { ok: false; error: string; status?: number }
> {
  const userId = pb.authStore.record?.id
  if (!userId) return { ok: false, error: 'Sign in required', status: 401 }
  try {
    const session = await ensureOpenSession(userId)
    await pb.collection('coach_sessions').update(session.id, { mode: 'human' })
    await pb.collection('coach_messages').create({
      user: userId,
      session: session.id,
      role: 'assistant',
      body: 'A specialist will join this chat shortly. The AI Coach is paused for now.',
    })
    return { ok: true, data: { mode: 'human', sessionId: session.id } }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Request failed', status: e?.status }
  }
}

export async function sendCoachUserMessage(body: string): Promise<
  | {
      ok: true
      data: { message: CoachMessage; session: CoachSession; needsAi: boolean }
    }
  | { ok: false; error: string; status?: number }
> {
  const userId = pb.authStore.record?.id
  if (!userId) return { ok: false, error: 'Sign in required', status: 401 }
  const text = body.trim()
  if (!text) return { ok: false, error: 'Message required' }
  try {
    const session = await ensureOpenSession(userId)
    const message = (await pb.collection('coach_messages').create({
      user: userId,
      session: session.id,
      role: 'user',
      body: text.slice(0, 4000),
    })) as unknown as CoachMessage
    const fresh = (await pb.collection('coach_sessions').getOne(session.id)) as unknown as CoachSession
    return {
      ok: true,
      data: {
        message,
        session: fresh,
        needsAi: fresh.mode !== 'human',
      },
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Send failed', status: e?.status }
  }
}

export async function saveAssistantMessage(body: string, sessionId: string, userId: string) {
  try {
    const row = await pb.collection('coach_messages').create({
      user: userId,
      session: sessionId,
      role: 'assistant',
      body,
    })
    return { ok: true as const, message: row as unknown as CoachMessage }
  } catch (e: any) {
    return { ok: false as const, error: e?.message || 'Save failed' }
  }
}

export async function runCoachAiTurn(opts: {
  userId: string
  profile?: UserProfile | null
  messages: { role: string; content: string }[]
  latestUserMessage: string
}): Promise<
  | { ok: true; reply: string; suggest_specialist?: boolean; mood_signal?: string }
  | { ok: false; error: string; status?: number }
> {
  const ctx = await buildCoachLearningContext(opts.userId, opts.profile)
  const languageCode = String(opts.profile?.language || 'en')
  const languageName = getLanguageDisplayName(languageCode)
  const rawProxy = import.meta.env.VITE_AI_PROXY_URL || '/api/ai/personalize'
  const token = pb.authStore.token
  try {
    const res = await fetch(apiUrl(rawProxy), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        userId: opts.userId,
        requestType: 'coach_chat',
        context: {
          dayNumber: ctx.dayNumber,
          archetype: ctx.archetype,
          learningContext: ctx.learningContext,
          messages: opts.messages,
          latestUserMessage: opts.latestUserMessage,
          languageCode,
          languageName,
        },
      }),
      signal: AbortSignal.timeout(20000),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data.error || `AI failed (${res.status})`, status: res.status }
    }
    const reply = cleanCoachReplyClient(String(data.reply || '').trim() || "I'm here with you.")
    return {
      ok: true,
      reply,
      suggest_specialist: !!data.suggest_specialist,
      mood_signal: data.mood_signal,
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'AI unavailable' }
  }
}
