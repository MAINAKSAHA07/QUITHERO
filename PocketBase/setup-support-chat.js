/**
 * support_tickets autodate + support_ticket_messages (user↔admin chat).
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'
// Messages go through /api/support/* (AES-GCM). Lock down so clients cannot write plaintext to PB.

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

function ensureAutodate(fields) {
  let next = [...(fields || [])]
  const names = new Set(next.map((f) => f.name))
  for (const spec of AUTODATE_FIELDS) {
    if (names.has(spec.name)) {
      next = next.map((f) =>
        f.name === spec.name && f.type !== 'autodate'
          ? { ...f, ...spec, id: f.id }
          : f
      )
      continue
    }
    next.push({ ...spec })
    names.add(spec.name)
  }
  return next
}

async function patchTicketAutodate() {
  const col = await pb.collections.getOne('support_tickets')
  await pb.collections.update(col.id, {
    listRule: `${adminRule} || @request.auth.id = user`,
    viewRule: `${adminRule} || @request.auth.id = user`,
    createRule: `${adminRule} || @request.auth.id = user`,
    updateRule: `${adminRule} || @request.auth.id = user`,
    deleteRule: adminRule,
    fields: ensureAutodate(col.fields),
  })
  console.log('✓ support_tickets rules + created/updated')
}

async function ensureMessages(ticketCollectionId) {
  const messageFields = [
    {
      name: 'ticket',
      type: 'relation',
      required: true,
      collectionId: ticketCollectionId,
      maxSelect: 1,
      cascadeDelete: true,
    },
    { name: 'body', type: 'text', required: true },
    {
      name: 'sender_role',
      type: 'select',
      required: true,
      values: ['user', 'admin'],
      maxSelect: 1,
    },
    { name: 'author_id', type: 'text', required: false },
    ...AUTODATE_FIELDS,
  ]

  const rules = {
    // null = superusers/API only (ciphertext never readable by app/admin JWTs)
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  }

  try {
    await pb.collections.create({
      name: 'support_ticket_messages',
      type: 'base',
      fields: messageFields.map((f) => ({
        ...f,
        system: false,
        hidden: false,
        presentable: false,
      })),
      ...rules,
    })
    console.log('✓ Created support_ticket_messages')
  } catch (e) {
    if (e.status !== 400) throw e
    let col
    try {
      col = await pb.collections.getOne('support_ticket_messages')
    } catch (lookupErr) {
      console.error('Create failed (not already existing):', e.response || e.message)
      throw e
    }
    console.log('⚠ support_ticket_messages already exists — patching')
    const names = new Set((col.fields || []).map((f) => f.name))
    let fields = [...(col.fields || [])]
    for (const spec of messageFields) {
      if (names.has(spec.name)) continue
      fields.push({ ...spec, system: false, hidden: false, presentable: false })
    }
    fields = ensureAutodate(fields)
    await pb.collections.update(col.id, { ...rules, fields })
    console.log('✓ Patched support_ticket_messages')
  }
}

async function main() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }

  await patchTicketAutodate()
  const tickets = await pb.collections.getOne('support_tickets')
  await ensureMessages(tickets.id)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
