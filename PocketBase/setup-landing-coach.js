/**
 * landing_coach_chats — anonymous marketing-site coach threads.
 * Server-only (admin rules); API uses superuser token.
 * Run: node PocketBase/setup-landing-coach.js
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'

const AUTODATE_FIELDS = [
  {
    name: 'created',
    type: 'autodate',
    onCreate: true,
    onUpdate: false,
    system: false,
    hidden: false,
    presentable: false,
  },
  {
    name: 'updated',
    type: 'autodate',
    onCreate: true,
    onUpdate: true,
    system: false,
    hidden: false,
    presentable: false,
  },
]

const BASE_FIELDS = [
  { name: 'guest_id', type: 'text', required: true },
  { name: 'messages', type: 'json', required: false },
  { name: 'user_message_count', type: 'number', required: false },
  { name: 'page', type: 'text', required: false },
]

const RULES = {
  listRule: adminRule,
  viewRule: adminRule,
  createRule: adminRule,
  updateRule: adminRule,
  deleteRule: adminRule,
}

const INDEXES = ['CREATE UNIQUE INDEX idx_landing_coach_guest ON landing_coach_chats (guest_id)']

function ensureFields(fields) {
  const next = [...(fields || [])]
  const names = new Set(next.map((f) => f.name))
  for (const spec of [...BASE_FIELDS, ...AUTODATE_FIELDS]) {
    if (names.has(spec.name)) continue
    next.push({ ...spec, system: false, hidden: false, presentable: false })
    names.add(spec.name)
  }
  // PB treats numeric 0 as blank when required — keep count optional
  for (const field of next) {
    if (field.name === 'user_message_count') field.required = false
  }
  return next
}

async function main() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }

  try {
    const col = await pb.collections.getOne('landing_coach_chats')
    await pb.collections.update(col.id, {
      fields: ensureFields(col.fields),
      indexes: INDEXES,
      ...RULES,
    })
    console.log('✓ Patched landing_coach_chats')
  } catch {
    await pb.collections.create({
      name: 'landing_coach_chats',
      type: 'base',
      fields: ensureFields([]),
      indexes: INDEXES,
      ...RULES,
    })
    console.log('✓ Created landing_coach_chats')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
