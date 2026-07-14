/**
 * user_profiles — craving + achievement notification toggles (Profile screen).
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const NEW_FIELDS = [
  { name: 'enable_craving_alerts', type: 'bool', required: false },
  { name: 'enable_achievement_notifications', type: 'bool', required: false },
]

function ensureField(fields, spec) {
  if (fields.some((f) => f.name === spec.name)) return fields
  return [...fields, { ...spec, system: false, hidden: false, presentable: false }]
}

async function main() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }

  const col = await pb.collections.getOne('user_profiles')
  let fields = col.fields || []
  for (const spec of NEW_FIELDS) {
    fields = ensureField(fields, spec)
  }
  await pb.collections.update(col.id, { fields })
  console.log('✓ user_profiles notification preference fields')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
