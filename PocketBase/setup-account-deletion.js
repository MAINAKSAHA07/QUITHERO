/**
 * account_deletion_requests — user submits; admin deletes the account.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'
const adminOrOwner = (field) => `${adminRule} || @request.auth.id = ${field}`

const FIELDS = [
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

const RULES = {
  listRule: adminOrOwner('user'),
  viewRule: adminOrOwner('user'),
  createRule: '@request.auth.id = user',
  updateRule: adminRule,
  deleteRule: adminRule,
}

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  try {
    await pb.collections.create({
      name: 'account_deletion_requests',
      type: 'base',
      fields: FIELDS,
      ...RULES,
    })
    console.log('✓ Created account_deletion_requests collection')
    return
  } catch (e) {
    if (e.status !== 400) throw e
    console.log('⚠ account_deletion_requests already exists — applying rules patch')
  }

  const collection = await pb.collections.getOne('account_deletion_requests')
  await pb.collections.update(collection.id, { ...RULES, fields: collection.fields || FIELDS })
  console.log('✓ Patched account_deletion_requests rules')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
