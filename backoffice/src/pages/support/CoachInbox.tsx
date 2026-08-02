import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { pb } from '../../lib/pocketbase'

type CoachSession = {
  id: string
  user: string
  mode: string
  status: string
  claimed_by?: string
  expand?: { user?: { email?: string; name?: string; id?: string } }
}

type CoachMessage = {
  id: string
  role: string
  body: string
  created?: string
}

function appApiBase(): string {
  const fromEnv = (
    import.meta.env.VITE_PUSH_API_ORIGIN ||
    import.meta.env.VITE_APP_API_ORIGIN ||
    ''
  ).replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (import.meta.env.PROD) return 'https://app.smono.app'
  return ''
}

function coachUrl(path: string) {
  const base = appApiBase()
  return base ? `${base}${path}` : path
}

async function coachFetch<T>(path: string, options?: { method?: string; body?: Record<string, unknown> }) {
  const token = pb.authStore.token
  if (!token) throw new Error('Login required')
  const res = await fetch(coachUrl(path), {
    method: options?.method || 'GET',
    headers: {
      Authorization: token,
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

export function CoachInbox() {
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const inbox = useQuery({
    queryKey: ['coach_inbox'],
    queryFn: () => coachFetch<{ items: CoachSession[] }>('/api/coach/inbox'),
    refetchInterval: 10000,
  })

  const active = (inbox.data?.items || []).find((s) => s.id === activeId) || null
  const userId = active
    ? typeof active.user === 'string'
      ? active.user
      : (active as any).expand?.user?.id
    : null

  const thread = useQuery({
    queryKey: ['coach_thread', userId],
    queryFn: () =>
      coachFetch<{ session: CoachSession; messages: CoachMessage[] }>(
        `/api/coach/session?userId=${encodeURIComponent(userId!)}`
      ),
    enabled: !!userId,
    refetchInterval: 5000,
  })

  const claim = useMutation({
    mutationFn: (sessionId: string) =>
      coachFetch('/api/coach/claim', { method: 'POST', body: { sessionId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach_inbox'] })
      setStatus('Claimed')
    },
    onError: (e: Error) => setStatus(e.message),
  })

  const release = useMutation({
    mutationFn: (sessionId: string) =>
      coachFetch('/api/coach/release', { method: 'POST', body: { sessionId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach_inbox'] })
      setActiveId(null)
      setStatus('Returned to AI')
    },
    onError: (e: Error) => setStatus(e.message),
  })

  const reply = useMutation({
    mutationFn: () =>
      coachFetch('/api/coach/messages', {
        method: 'POST',
        body: { sessionId: activeId, body: draft.trim() },
      }),
    onSuccess: () => {
      setDraft('')
      void queryClient.invalidateQueries({ queryKey: ['coach_thread', userId] })
      setStatus('Sent')
    },
    onError: (e: Error) => setStatus(e.message),
  })

  const items = inbox.data?.items || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark">Coach inbox</h1>
        <p className="text-neutral-500 mt-1">Human takeover for AI Coach threads</p>
      </div>

      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[28rem]">
        <div className="card p-0 overflow-hidden lg:col-span-1">
          <div className="px-4 py-3 border-b border-neutral-100 font-semibold text-sm">
            Waiting / human mode ({items.length})
          </div>
          <div className="divide-y divide-neutral-100 max-h-[32rem] overflow-y-auto">
            {inbox.isLoading ? (
              <p className="p-4 text-sm text-neutral-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-sm text-neutral-400">No human-mode sessions</p>
            ) : (
              items.map((s) => {
                const label =
                  s.expand?.user?.email ||
                  s.expand?.user?.name ||
                  (typeof s.user === 'string' ? s.user.slice(0, 10) : 'user')
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 ${
                      activeId === s.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="font-medium text-neutral-dark truncate">{label}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {s.claimed_by ? 'Claimed' : 'Unclaimed'} · {s.mode}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="card p-4 lg:col-span-2 flex flex-col min-h-[28rem]">
          {!active ? (
            <p className="text-sm text-neutral-400 m-auto">Select a session</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  disabled={claim.isPending}
                  onClick={() => claim.mutate(active.id)}
                >
                  Claim
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={release.isPending}
                  onClick={() => {
                    if (window.confirm('Return this chat to the AI Coach?')) release.mutate(active.id)
                  }}
                >
                  Return to AI
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 border border-neutral-100 rounded-lg p-3 bg-neutral-50 mb-3 max-h-[22rem]">
                {(thread.data?.messages || []).map((m) => (
                  <div
                    key={m.id}
                    className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                      m.role === 'user'
                        ? 'bg-white ml-auto border border-neutral-200'
                        : m.role === 'human'
                          ? 'bg-neutral-900 text-white'
                          : 'bg-primary/10'
                    }`}
                  >
                    <div className="text-[10px] uppercase opacity-60 mb-0.5">{m.role}</div>
                    {m.body}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Reply as specialist…"
                />
                <button
                  type="button"
                  className="btn-primary self-end"
                  disabled={!draft.trim() || reply.isPending}
                  onClick={() => reply.mutate()}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
