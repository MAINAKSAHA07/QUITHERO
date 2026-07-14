/**
 * media — file uploads for blog covers, session images/videos, Media Library.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const MEDIA_FIELDS = [
  { name: 'filename', type: 'text', required: true },
  {
    name: 'type',
    type: 'select',
    required: true,
    values: ['image', 'video', 'audio', 'document', 'other'],
  },
  { name: 'file', type: 'file', maxSelect: 1, maxSize: 104857600 },
  { name: 'url', type: 'url', required: false },
  { name: 'size', type: 'number' },
  { name: 'folder', type: 'text' },
]

function toPbField(spec) {
  const base = {
    name: spec.name,
    type: spec.type,
    required: !!spec.required,
    system: false,
    hidden: false,
    presentable: false,
  }
  if (spec.type === 'select') {
    base.values = spec.values
    base.maxSelect = 1
  }
  if (spec.type === 'file') {
    base.maxSelect = spec.maxSelect ?? 1
    base.maxSize = spec.maxSize ?? 104857600
  }
  if (spec.type === 'url') {
    base.onlyDomains = []
  }
  return base
}

function ensureField(fields, spec) {
  if (fields.some((f) => f.name === spec.name)) return fields
  return [...fields, toPbField(spec)]
}

async function auth() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }
}

async function main() {
  await auth()

  try {
    await pb.collections.create({
      name: 'media',
      type: 'base',
      fields: MEDIA_FIELDS.map(toPbField),
    })
    console.log('✓ created media collection')
    return
  } catch (e) {
    if (e.status !== 400) throw e
    console.log('⚠ media collection already exists — ensuring fields')
  }

  const col = await pb.collections.getOne('media')
  let fields = col.fields || []
  for (const spec of MEDIA_FIELDS) {
    fields = ensureField(fields, spec)
  }
  await pb.collections.update(col.id, { fields })
  console.log('✓ media collection fields ready')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
