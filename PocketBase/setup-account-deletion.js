/**
 * account_deletion_requests — user submits; admin deletes the account.
 * Ensures rules + created/updated autodate (needed for -created sorts).
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'
const adminOrOwner = (field) => `${adminRule} || @request.auth.id = ${field}`

const BASE_FIELDS = [
  { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
  {
    name: 'status',
    type: 'select',
    required: true,
    values: ['pending', 'rejected', 'completed'],
    maxSelect: 1,
  },
  { name: 'reason', type: 'text', required: false },
  { name: 'admin_notes', type: 'text', required: false },
  { name: 'processed_at', type: 'date', required: false },
]

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

const RULES = {
  listRule: adminOrOwner('user'),
  viewRule: adminOrOwner('user'),
  createRule: '@request.auth.id = user',
  updateRule: adminRule,
  deleteRule: adminRule,
}

function ensureFields(fields) {
  let next = [...(fields || [])]
  const names = new Set(next.map((f) => f.name))
  for (const spec of [...BASE_FIELDS, ...AUTODATE_FIELDS]) {
    if (names.has(spec.name)) continue
    next.push({ ...spec, system: false, hidden: false, presentable: false })
    names.add(spec.name)
  }
  // Upgrade existing non-autodate created/updated if somehow wrong type
  next = next.map((f) => {
    if ((f.name === 'created' || f.name === 'updated') && f.type !== 'autodate') {
      const spec = AUTODATE_FIELDS.find((s) => s.name === f.name)
      return { ...f, ...spec, id: f.id }
    }
    return f
  })
  return next
}

async function main() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }

  try {
    await pb.collections.create({
      name: 'account_deletion_requests',
      type: 'base',
      fields: ensureFields([]),
      ...RULES,
    })
    console.log('✓ Created account_deletion_requests collection')
    return
  } catch (e) {
    if (e.status !== 400) throw e
    console.log('⚠ account_deletion_requests already exists — patching fields/rules')
  }

  const collection = await pb.collections.getOne('account_deletion_requests')
  await pb.collections.update(collection.id, {
    ...RULES,
    fields: ensureFields(collection.fields),
  })
  console.log('✓ Patched account_deletion_requests (rules + created/updated)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
