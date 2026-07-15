/**
 * cravings — ensure created/updated autodate fields exist.
 * Without these, history shows "Invalid Date" for every log.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

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

async function main() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }

  const col = await pb.collections.getOne('cravings')
  let fields = [...(col.fields || [])]
  let changed = false

  for (const spec of AUTODATE_FIELDS) {
    const idx = fields.findIndex((f) => f.name === spec.name)
    if (idx === -1) {
      fields.push(spec)
      changed = true
      continue
    }
    if (fields[idx].type !== 'autodate') {
      fields[idx] = { ...fields[idx], ...spec, id: fields[idx].id }
      changed = true
    }
  }

  if (!changed) {
    console.log('✓ cravings already has created/updated autodate')
    return
  }

  await pb.collections.update(col.id, { fields })
  console.log('✓ cravings created/updated autodate fields ready')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
