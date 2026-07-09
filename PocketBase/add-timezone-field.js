/**
 * Adds user_profiles.timezone for timezone-aware push reminders.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const run = async () => {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  const col = await pb.collections.getOne('user_profiles')
  if (!col.fields?.some((f) => f.name === 'timezone')) {
    col.fields.push({
      name: 'timezone',
      type: 'text',
      required: false,
      system: false,
      hidden: false,
      presentable: false,
    })
    await pb.collections.update('user_profiles', { fields: col.fields })
    console.log('✔ added user_profiles.timezone')
  } else {
    console.log('✓ user_profiles.timezone already exists')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
