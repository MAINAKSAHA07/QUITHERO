/**
 * Seed / refresh notification_templates for email + promotions.
 * Run: node PocketBase/seed-email-templates.js
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'
import { seedEmailTemplateDefs, BRAND } from '../scripts/email-templates.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)
const APP_URL = (process.env.PUBLIC_URL || BRAND.appUrl).replace(/\/$/, '')

async function auth() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }
}

async function main() {
  await auth()
  const defs = seedEmailTemplateDefs(APP_URL)
  let created = 0
  let updated = 0

  for (const def of defs) {
    const filter = `trigger_event = "${def.trigger_event}" && language = "${def.language}" && type = "${def.type}"`
    let existing = null
    try {
      existing = await pb.collection('notification_templates').getFirstListItem(filter)
    } catch {
      existing = null
    }

    if (existing?.id) {
      await pb.collection('notification_templates').update(existing.id, {
        name: def.name,
        subject: def.subject,
        content: def.content,
        from_name: def.from_name,
        from_email: def.from_email,
        is_active: def.is_active,
      })
      updated++
      console.log(`✓ updated ${def.trigger_event}`)
    } else {
      await pb.collection('notification_templates').create(def)
      created++
      console.log(`✓ created ${def.trigger_event}`)
    }
  }

  console.log(`Done. created=${created} updated=${updated}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
