import { pb, adminCollectionHelpers } from './pocketbase'

/**
 * Collections that store a `user` relation to auth users.
 * Production schemas often lack cascadeDelete — purge explicitly before user delete.
 */
const USER_OWNED_COLLECTIONS = [
  'account_deletion_requests',
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
] as const

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
    // Collection missing or no permission — skip
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

/**
 * Delete a user and every known row that required-references them.
 * Call this instead of bare users.delete — otherwise PocketBase returns
 * "Failed to delete record. Make sure that the record is not part of a required relation reference."
 */
export async function deleteUserAndRelated(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'Missing user id' }

  try {
    // Clear optional reverse refs (tickets assigned to this user)
    try {
      const assigned = await pb.collection('support_tickets').getFullList({
        filter: `assigned_to = "${userId}"`,
        fields: 'id',
        batch: 200,
      })
      for (const row of assigned) {
        await pb.collection('support_tickets').update(row.id, { assigned_to: '' })
      }
    } catch {
      /* optional field / collection */
    }

    await deleteSupportTicketsForUser(userId)

    for (const collection of USER_OWNED_COLLECTIONS) {
      if (collection === 'support_tickets') continue // already handled with messages
      await deleteByFilter(collection, `user = "${userId}"`)
    }

    const result = await adminCollectionHelpers.delete('users', userId)
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to delete user' }
    }
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    return { success: false, error: message }
  }
}
