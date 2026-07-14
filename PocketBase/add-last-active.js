/**
 * Adds users.lastActive and backfills from session_progress completed_at.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const run = async () => {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  const usersCol = await pb.collections.getOne('users')
  const hasField = usersCol.fields?.some((f) => f.name === 'lastActive')
  if (!hasField) {
    usersCol.fields.push({
      name: 'lastActive',
      type: 'date',
      required: false,
      system: false,
      hidden: false,
      presentable: false,
    })
    await pb.collections.update('users', { fields: usersCol.fields })
    console.log('✔ added users.lastActive')
  } else {
    console.log('✓ users.lastActive already exists')
  }

  const progress = await pb.collection('session_progress').getFullList({
    fields: 'user,completed_at,updated,created',
  })

  const latestByUser = new Map()
  for (const row of progress) {
    const raw = row.completed_at
    if (!raw) continue
    const t = new Date(raw).getTime()
    const prev = latestByUser.get(row.user) ?? 0
    if (t > prev) latestByUser.set(row.user, raw)
  }

  const users = await pb.collection('users').getFullList({ fields: 'id,lastActive' })
  let updated = 0
  for (const user of users) {
    const candidate = latestByUser.get(user.id)
    if (!candidate) continue
    if (user.lastActive && new Date(user.lastActive) >= new Date(candidate)) continue
    await pb.collection('users').update(user.id, { lastActive: candidate })
    updated++
  }
  console.log(`✔ backfilled lastActive for ${updated} users`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
