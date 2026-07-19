/**
 * coupons — percent-off codes for checkout. Admin CRUD; server redeems via superuser.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'

const BASE_FIELDS = [
  { name: 'code', type: 'text', required: true },
  { name: 'percent_off', type: 'number', required: true },
  { name: 'active', type: 'bool', required: false },
  { name: 'max_redemptions', type: 'number', required: false },
  { name: 'redeemed_count', type: 'number', required: false },
  // ponytail: order ids already counted — idempotent redeem across verify + webhook
  { name: 'redeemed_orders', type: 'json', required: false },
  { name: 'valid_from', type: 'date', required: false },
  { name: 'valid_until', type: 'date', required: false },
  { name: 'notes', type: 'text', required: false },
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
  createRule: adminRule,
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
    col = await pb.collections.getOne('coupons')
    console.log('✓ coupons exists — patching')
  } catch {
    col = await pb.collections.create({
      name: 'coupons',
      type: 'base',
      fields: ensureFields([]),
      ...RULES,
    })
    console.log('✓ Created coupons')
    return
  }

  await pb.collections.update(col.id, {
    fields: ensureFields(col.fields),
    ...RULES,
  })
  console.log('✓ Patched coupons')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
