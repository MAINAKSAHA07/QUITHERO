/**
 * payment_events — Razorpay webhook log for admin billing panel.
 * Server writes via admin token; admins list/view only.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'

const BASE_FIELDS = [
  { name: 'event_id', type: 'text', required: true },
  { name: 'event', type: 'text', required: true },
  { name: 'payment_id', type: 'text', required: false },
  { name: 'order_id', type: 'text', required: false },
  { name: 'refund_id', type: 'text', required: false },
  { name: 'status', type: 'text', required: false },
  { name: 'amount', type: 'number', required: false },
  { name: 'currency', type: 'text', required: false },
  { name: 'method', type: 'text', required: false },
  { name: 'email', type: 'text', required: false },
  { name: 'contact', type: 'text', required: false },
  {
    name: 'user',
    type: 'relation',
    required: false,
    collectionId: '_pb_users_auth_',
    maxSelect: 1,
    cascadeDelete: false,
  },
  { name: 'notes', type: 'json', required: false },
  { name: 'payload', type: 'json', required: false },
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
  listRule: adminRule,
  viewRule: adminRule,
  createRule: null, // server-only via admin API
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
  return next
}

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  let col
  try {
    col = await pb.collections.getOne('payment_events')
    console.log('✓ payment_events exists — patching')
  } catch {
    col = await pb.collections.create({
      name: 'payment_events',
      type: 'base',
      fields: ensureFields([]),
      ...RULES,
    })
    console.log('✓ Created payment_events')
    return
  }

  await pb.collections.update(col.id, {
    fields: ensureFields(col.fields),
    ...RULES,
  })
  console.log('✓ Patched payment_events')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
