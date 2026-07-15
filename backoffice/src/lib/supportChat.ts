import { pb } from '../lib/pocketbase'

export type SupportMessage = {
  id: string
  ticket: string
  body: string
  sender_role: 'user' | 'admin'
  author_id?: string
  created?: string
  updated?: string
}

async function supportFetch<T>(
  path: string,
  options?: { method?: string; body?: Record<string, unknown> }
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const token = pb.authStore.token
    if (!token) return { success: false, error: 'Login required' }
    const res = await fetch(path, {
      method: options?.method || 'GET',
      headers: {
        Authorization: token,
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || data.message || `Request failed (${res.status})` }
    }
    return { success: true, data: (data.data ?? data) as T }
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' }
  }
}

export async function fetchTicketMessages(ticketId: string) {
  return supportFetch<SupportMessage[]>(
    `/api/support/messages?ticket=${encodeURIComponent(ticketId)}`
  )
}

export async function replyTicketMessage(ticketId: string, body: string) {
  return supportFetch<SupportMessage>('/api/support/messages', {
    method: 'POST',
    body: { ticket: ticketId, body },
  })
}
