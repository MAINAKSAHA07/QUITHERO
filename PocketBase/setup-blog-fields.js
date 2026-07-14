/**
 * content_items — blog fields + long HTML body support.
 * ponytail: PB text fields with max=0 default to 5000 chars; blogs need more.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

/** Max chars for HTML blog/article body (≈40–50k words with markup). */
const CONTENT_MAX = 200_000

const NEW_FIELDS = [
  { name: 'slug', type: 'text', required: false },
  { name: 'excerpt', type: 'text', required: false },
  { name: 'published_at', type: 'date', required: false },
]

function ensureField(fields, spec) {
  if (fields.some((f) => f.name === spec.name)) return fields
  return [...fields, { ...spec, system: false, hidden: false, presentable: false }]
}

async function main() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }

  const col = await pb.collections.getOne('content_items')
  let fields = col.fields || []

  for (const spec of NEW_FIELDS) {
    fields = ensureField(fields, spec)
  }

  fields = fields.map((f) => {
    if (f.name === 'content' && f.type === 'text' && (f.max === 0 || f.max < CONTENT_MAX)) {
      return { ...f, max: CONTENT_MAX }
    }
    return f
  })

  await pb.collections.update(col.id, { fields })
  console.log(`✓ content_items ready (content max ${CONTENT_MAX.toLocaleString()} chars)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
