/**
 * Bump notification_templates.content max so pasted HTML emails fit.
 * Run: node PocketBase/setup-notification-template-content.js
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const CONTENT_MAX = 200_000
const { url, email, password } = initPocketBase()
const pb = new PocketBase(url)

async function auth() {
  try {
    await pb.collection('_superusers').authWithPassword(email, password)
  } catch {
    await pb.admins.authWithPassword(email, password)
  }
}

async function main() {
  await auth()
  const col = await pb.collections.getOne('notification_templates')
  const fields = col.fields || col.schema || []
  let changed = false
  for (const f of fields) {
    if (f.name === 'content' && f.type === 'text') {
      const max = f.max ?? f.options?.max ?? 0
      if (max === 0 || max < CONTENT_MAX) {
        f.max = CONTENT_MAX
        if (f.options) f.options.max = CONTENT_MAX
        changed = true
      }
    }
  }
  if (changed) {
    await pb.collections.update(col.id, { fields })
    console.log(`✓ notification_templates.content max → ${CONTENT_MAX}`)
  } else {
    console.log('✓ notification_templates.content already large enough')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
