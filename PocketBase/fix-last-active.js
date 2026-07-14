/**
 * Clears users.lastActive when there is no real app activity (heartbeat pollution).
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

function latestMs(rows, pick) {
  let max = 0
  for (const row of rows) {
    const raw = pick(row)
    if (!raw) continue
    const t = new Date(raw).getTime()
    if (t > max) max = t
  }
  return max
}

const run = async () => {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }

  const [progress, cravings, smoke, journals, users] = await Promise.all([
    pb.collection('session_progress').getFullList({ fields: 'user,completed_at' }),
    pb.collection('cravings').getFullList({ fields: 'user,created' }),
    pb.collection('smoke_check_ins').getFullList({ fields: 'user,responded_at,created' }),
    pb.collection('journal_entries').getFullList({ fields: 'user,date,created' }),
    pb.collection('users').getFullList({ fields: 'id,lastActive' }),
  ])

  const realByUser = new Map()
  for (const row of progress) {
    if (!row.user || !row.completed_at) continue
    const t = new Date(row.completed_at).getTime()
    realByUser.set(row.user, Math.max(realByUser.get(row.user) ?? 0, t))
  }
  for (const rows of [cravings, smoke, journals]) {
    for (const row of rows) {
      if (!row.user) continue
      const raw = row.responded_at || row.date || row.created
      if (!raw) continue
      const t = new Date(raw).getTime()
      realByUser.set(row.user, Math.max(realByUser.get(row.user) ?? 0, t))
    }
  }

  let cleared = 0
  let synced = 0
  for (const user of users) {
    const realMs = realByUser.get(user.id)
    if (!realMs) {
      if (user.lastActive) {
        await pb.collection('users').update(user.id, { lastActive: null })
        cleared++
      }
      continue
    }
    const realIso = new Date(realMs).toISOString()
    if (!user.lastActive || new Date(user.lastActive).getTime() !== realMs) {
      await pb.collection('users').update(user.id, { lastActive: realIso })
      synced++
    }
  }
  console.log(`✔ cleared bogus lastActive for ${cleared} users, synced ${synced} from real events`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
