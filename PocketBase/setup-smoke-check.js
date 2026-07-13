/**
 * smoke_check_ins — 6-hour user-confirmed smoke-free tracking.
 * ponytail: PocketBase required bool rejects `false` as blank — keep smoked optional.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminOrOwner = (field) =>
  `@request.auth.collectionName = "admin_users" || @request.auth.id = ${field}`

const FIELDS = [
  { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
  { name: 'smoked', type: 'bool', required: false },
  { name: 'periods_credited', type: 'number' },
  { name: 'period_start', type: 'date', required: true },
  { name: 'period_end', type: 'date', required: true },
  { name: 'responded_at', type: 'date', required: true },
  {
    name: 'source',
    type: 'select',
    values: ['in_app', 'push', 'scheduler'],
    maxSelect: 1,
  },
]

const RULES = {
  listRule: adminOrOwner('user'),
  viewRule: adminOrOwner('user'),
  createRule: adminOrOwner('user'),
  updateRule: adminOrOwner('user'),
  deleteRule: '@request.auth.collectionName = "admin_users"',
}

async function patchSmokedField(collection) {
  const fields = (collection.fields || []).map((field) => {
    if (field.name !== 'smoked') return field
    return { ...field, required: false }
  })
  await pb.collections.update(collection.id, { ...RULES, fields })
  console.log('✓ Patched smoke_check_ins.smoked (required=false — PB treats false as blank)')
}

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  try {
    await pb.collections.create({
      name: 'smoke_check_ins',
      type: 'base',
      fields: FIELDS,
      ...RULES,
    })
    console.log('✓ Created smoke_check_ins collection')
    return
  } catch (e) {
    if (e.status !== 400) throw e
    console.log('⚠ smoke_check_ins already exists — applying schema/rules patch')
  }

  const collection = await pb.collections.getOne('smoke_check_ins')
  await patchSmokedField(collection)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
