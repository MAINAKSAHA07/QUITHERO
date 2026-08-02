/**
 * Admin-defined user cohorts for backoffice targeting.
 * Run: node PocketBase/setup-user-segments.js
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

async function auth() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }
}

async function main() {
  await auth()

  const fields = [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text', required: false },
    { name: 'criteria', type: 'json', required: true },
    { name: 'created_by', type: 'text', required: false },
    ...AUTODATE_FIELDS,
  ].map((f) => ({ ...f, system: false, hidden: false, presentable: false }))

  const rules = {
    listRule: adminRule,
    viewRule: adminRule,
    createRule: adminRule,
    updateRule: adminRule,
    deleteRule: adminRule,
  }

  try {
    await pb.collections.create({
      name: 'user_segments',
      type: 'base',
      fields,
      ...rules,
    })
    console.log('✓ Created user_segments')
  } catch (e) {
    if (e.status !== 400) throw e
    const col = await pb.collections.getOne('user_segments')
    let next = [...(col.fields || [])]
    for (const spec of fields) {
      if (!next.some((f) => f.name === spec.name)) next.push(spec)
    }
    await pb.collections.update(col.id, { fields: next, ...rules })
    console.log('✓ Patched user_segments')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
