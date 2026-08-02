/**
 * gifts — server-managed Razorpay gifts and recipient claims.
 * No client collection access; API server uses superuser credentials.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'

const BASE_FIELDS = [
  { name: 'razorpay_order_id', type: 'text', required: true },
  { name: 'razorpay_payment_id', type: 'text', required: false },
  { name: 'buyer_email', type: 'email', required: true },
  { name: 'buyer_name', type: 'text', required: false },
  { name: 'recipient_email', type: 'email', required: true },
  { name: 'recipient_name', type: 'text', required: false },
  { name: 'message', type: 'text', required: false },
  { name: 'country', type: 'text', required: true },
  { name: 'amount_major', type: 'number', required: true },
  { name: 'currency', type: 'text', required: true },
  { name: 'coupon', type: 'text', required: false },
  { name: 'status', type: 'select', required: true, values: ['pending', 'paid', 'partially_claimed', 'claimed'], maxSelect: 1 },
  { name: 'buyer_user_id', type: 'text', required: false },
  { name: 'recipient_user_id', type: 'text', required: false },
  { name: 'buyer_claim_token_hash', type: 'text', required: false },
  // Only a SHA-256 digest is stored; the raw token exists only in the email URL.
  { name: 'recipient_claim_token_hash', type: 'text', required: true },
  { name: 'buyer_emailed_at', type: 'date', required: false },
  { name: 'recipient_emailed_at', type: 'date', required: false },
  { name: 'paid_at', type: 'date', required: false },
]

const AUTODATE_FIELDS = [
  { name: 'created', type: 'autodate', onCreate: true, onUpdate: false, system: false, hidden: false, presentable: false },
  { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true, system: false, hidden: false, presentable: false },
]

const RULES = {
  listRule: adminRule,
  viewRule: adminRule,
  createRule: adminRule,
  updateRule: adminRule,
  deleteRule: adminRule,
}

const GIFT_INDEXES = [
  'CREATE UNIQUE INDEX idx_gifts_order ON gifts (razorpay_order_id)',
  'CREATE UNIQUE INDEX idx_gifts_claim_hash ON gifts (recipient_claim_token_hash)',
]

function ensureFields(fields) {
  const next = [...(fields || [])]
  const names = new Set(next.map((field) => field.name))
  for (const spec of [...BASE_FIELDS, ...AUTODATE_FIELDS]) {
    if (names.has(spec.name)) continue
    next.push({ ...spec, system: false, hidden: false, presentable: false })
    names.add(spec.name)
  }
  // Recipient-only gifts no longer set buyer_claim_token_hash — drop required flag on existing field.
  for (const field of next) {
    if (field.name === 'buyer_claim_token_hash') field.required = false
  }
  return next
}

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  let collection
  try {
    collection = await pb.collections.getOne('gifts')
  } catch {
    await pb.collections.create({
      name: 'gifts',
      type: 'base',
      fields: ensureFields([]),
      indexes: GIFT_INDEXES,
      ...RULES,
    })
    console.log('✓ Created gifts')
    return
  }
  await pb.collections.update(collection.id, {
    fields: ensureFields(collection.fields),
    indexes: GIFT_INDEXES,
    ...RULES,
  })
  console.log('✓ Patched gifts')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
