import { adminCollectionHelpers } from './pocketbase'
import { indexActivityByUser, type ActivityRecord } from './userActivity'

async function loadActivityRecords(): Promise<ActivityRecord[]> {
  const [sessions, cravings, smokeChecks, journals] = await Promise.all([
    adminCollectionHelpers.getFullList('session_progress', {
      fields: 'user,completed_at',
    }),
    adminCollectionHelpers.getFullList('cravings', { fields: 'user,created,updated' }),
    adminCollectionHelpers.getFullList('smoke_check_ins', {
      fields: 'user,responded_at,created',
    }),
    adminCollectionHelpers.getFullList('journal_entries', {
      fields: 'user,date',
    }),
  ])

  return [
    ...((sessions.data || []) as ActivityRecord[]),
    ...((cravings.data || []) as ActivityRecord[]),
    ...((smokeChecks.data || []) as ActivityRecord[]),
    ...((journals.data || []) as ActivityRecord[]),
  ]
}

/** Sessions, cravings, smoke checks, journals — not passive app heartbeats. */
export async function fetchActivityByUser(): Promise<Map<string, number>> {
  return indexActivityByUser(await loadActivityRecords())
}

export async function fetchActivityRecords(): Promise<ActivityRecord[]> {
  return loadActivityRecords()
}
