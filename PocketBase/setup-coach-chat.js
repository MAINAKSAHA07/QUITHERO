/**
 * Coach chat: enable_coach_chat on user_profiles + coach_sessions + coach_messages.
 * Run: node PocketBase/setup-coach-chat.js
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'
const adminOrOwner = (field) => `${adminRule} || @request.auth.id = ${field}`

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

function ensureField(fields, spec) {
  if (fields.some((f) => f.name === spec.name)) return fields
  return [...fields, { ...spec, system: false, hidden: false, presentable: false }]
}

async function auth() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }
}

async function ensureProfileFlag() {
  const col = await pb.collections.getOne('user_profiles')
  const fields = ensureField(col.fields || [], {
    name: 'enable_coach_chat',
    type: 'bool',
    required: false,
  })
  await pb.collections.update(col.id, { fields })
  console.log('✓ user_profiles.enable_coach_chat')
}

async function ensureSessions(usersCollectionId) {
  const fields = [
    {
      name: 'user',
      type: 'relation',
      required: true,
      collectionId: usersCollectionId,
      maxSelect: 1,
      cascadeDelete: true,
    },
    {
      name: 'mode',
      type: 'select',
      required: true,
      values: ['ai', 'human'],
      maxSelect: 1,
    },
    { name: 'claimed_by', type: 'text', required: false },
    { name: 'claimed_at', type: 'date', required: false },
    {
      name: 'status',
      type: 'select',
      required: true,
      values: ['open', 'closed'],
      maxSelect: 1,
    },
    ...AUTODATE_FIELDS,
  ].map((f) => ({ ...f, system: false, hidden: false, presentable: false }))

  const rules = {
    listRule: adminOrOwner('user'),
    viewRule: adminOrOwner('user'),
    createRule: adminOrOwner('user'),
    updateRule: adminOrOwner('user'),
    deleteRule: adminRule,
  }

  try {
    const created = await pb.collections.create({
      name: 'coach_sessions',
      type: 'base',
      fields,
      ...rules,
    })
    console.log('✓ Created coach_sessions')
    return created.id
  } catch (e) {
    if (e.status !== 400) throw e
    const col = await pb.collections.getOne('coach_sessions')
    let next = [...(col.fields || [])]
    for (const spec of fields) {
      if (!next.some((f) => f.name === spec.name)) next.push(spec)
    }
    await pb.collections.update(col.id, { fields: next, ...rules })
    console.log('✓ Patched coach_sessions')
    return col.id
  }
}

async function ensureMessages(usersCollectionId, sessionsCollectionId) {
  const fields = [
    {
      name: 'user',
      type: 'relation',
      required: true,
      collectionId: usersCollectionId,
      maxSelect: 1,
      cascadeDelete: true,
    },
    {
      name: 'session',
      type: 'relation',
      required: true,
      collectionId: sessionsCollectionId,
      maxSelect: 1,
      cascadeDelete: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      values: ['user', 'assistant', 'human'],
      maxSelect: 1,
    },
    { name: 'body', type: 'text', required: true },
    ...AUTODATE_FIELDS,
  ].map((f) => ({ ...f, system: false, hidden: false, presentable: false }))

  const rules = {
    listRule: adminOrOwner('user'),
    viewRule: adminOrOwner('user'),
    createRule: adminOrOwner('user'),
    updateRule: adminRule,
    deleteRule: adminRule,
  }

  try {
    await pb.collections.create({
      name: 'coach_messages',
      type: 'base',
      fields,
      ...rules,
    })
    console.log('✓ Created coach_messages')
  } catch (e) {
    if (e.status !== 400) throw e
    const col = await pb.collections.getOne('coach_messages')
    let next = [...(col.fields || [])]
    for (const spec of fields) {
      if (!next.some((f) => f.name === spec.name)) next.push(spec)
    }
    await pb.collections.update(col.id, { fields: next, ...rules })
    console.log('✓ Patched coach_messages')
  }
}

async function main() {
  await auth()
  await ensureProfileFlag()
  const users = await pb.collections.getOne('users')
  const sessionId = await ensureSessions(users.id)
  await ensureMessages(users.id, sessionId)
  console.log('Coach chat schema ready')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
