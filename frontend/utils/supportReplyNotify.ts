import { pb } from '../lib/pocketbase'
import { NotificationService } from './notifications'

/** Debounce OS toasts only — do NOT treat as “user read the reply”. */
const NOTIFIED_KEY = 'smono_support_reply_notified'
/** Ticket ids with unread admin replies (in-app badge until thread opened). */
const PENDING_KEY = 'smono_support_pending_tickets'

let viewingSupportTicketId: string | null = null

function readIdSet(key: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeIdSet(key: string, ids: Set<string>) {
  sessionStorage.setItem(key, JSON.stringify([...ids].slice(-40)))
}

function markNotified(eventId: string) {
  const next = readIdSet(NOTIFIED_KEY)
  next.add(eventId)
  writeIdSet(NOTIFIED_KEY, next)
}

function addPendingTicket(ticketId: string) {
  if (!ticketId) return
  const next = readIdSet(PENDING_KEY)
  next.add(ticketId)
  writeIdSet(PENDING_KEY, next)
}

export function getPendingSupportTicketIds(): string[] {
  return [...readIdSet(PENDING_KEY)]
}

export function clearPendingSupportTicket(ticketId: string) {
  if (!ticketId) return
  const next = readIdSet(PENDING_KEY)
  next.delete(ticketId)
  writeIdSet(PENDING_KEY, next)
}

export function setViewingSupportTicket(ticketId: string | null) {
  viewingSupportTicketId = ticketId
  tellSwSupportViewing(ticketId)
}

export function tellSwSupportViewing(ticketId: string | null) {
  if (!('serviceWorker' in navigator)) return
  const payload = { type: 'support_viewing', ticketId }
  navigator.serviceWorker.controller?.postMessage(payload)
  void navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage(payload))
}

/** Mark support_reply notification_events for a ticket as opened (user is reading the thread). */
export async function markSupportReplyNoticesOpened(ticketId: string): Promise<void> {
  if (!ticketId || !pb.authStore.isValid) return
  clearPendingSupportTicket(ticketId)
  try {
    const rows = await pb.collection('notification_events').getList(1, 20, {
      filter: `trigger_type = "support_reply" && archetype_at_send ~ "${ticketId}"`,
      sort: '-created',
    })
    const now = new Date().toISOString()
    await Promise.all(
      rows.items.map(async (row) => {
        if (row.opened_at) return
        markNotified(row.id)
        try {
          await pb.collection('notification_events').update(row.id, { opened_at: now })
        } catch {
          /* ignore */
        }
      })
    )
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent('smono_support_pending_change', { detail: { ticketId, pending: false } })
  )
}

/**
 * Surface unopened support replies: in-app event + pending badge always;
 * OS notification only when permission granted (and once per event per session).
 */
export async function checkPendingSupportReplyNotices(userId: string): Promise<void> {
  if (!userId) return
  try {
    const rows = await pb.collection('notification_events').getList(1, 12, {
      filter: `user = "${userId}" && trigger_type = "support_reply"`,
      sort: '-created',
    })
    const notified = readIdSet(NOTIFIED_KEY)
    for (const row of rows.items) {
      if (row.opened_at) continue
      const ticketId = String(row.archetype_at_send || '').replace(/^support:/, '') || null

      if (ticketId && viewingSupportTicketId === ticketId) {
        markNotified(row.id)
        clearPendingSupportTicket(ticketId)
        try {
          await pb.collection('notification_events').update(row.id, {
            opened_at: new Date().toISOString(),
          })
        } catch {
          /* ignore */
        }
        continue
      }

      if (ticketId) addPendingTicket(ticketId)

      window.dispatchEvent(
        new CustomEvent('smono_support_reply', {
          detail: {
            ticketId,
            eventId: row.id,
            title: row.message_title || 'Support replied',
            body: row.message_body || 'You have a new support reply.',
          },
        })
      )
      window.dispatchEvent(
        new CustomEvent('smono_support_pending_change', {
          detail: { ticketId, pending: true },
        })
      )

      if (notified.has(row.id)) continue
      markNotified(row.id)
      NotificationService.triggerNativeNotification(
        row.message_title || 'Support replied',
        row.message_body || 'You have a new support reply.',
        ticketId ? `/profile?support=${encodeURIComponent(ticketId)}` : '/profile',
        {
          tag: ticketId ? `support-${ticketId}` : 'support-reply',
          eventId: row.id,
          triggerType: 'support_reply',
        }
      )
    }
  } catch {
    /* collection missing / offline — ignore */
  }
}
