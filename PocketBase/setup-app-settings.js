/**
 * app_settings — single global JSON blob for backoffice App Settings.
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const GLOBAL_KEY = 'global'

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
      name: 'app_settings',
      type: 'base',
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'settings', type: 'json', required: true },
      ],
    })
    console.log('✓ created app_settings collection')
  } catch (e) {
    if (e.status !== 400) throw e
    console.log('⚠ app_settings already exists')
  }

  try {
    await pb.collection('app_settings').getFirstListItem(`key = "${GLOBAL_KEY}"`)
    console.log('✓ global app_settings record exists')
  } catch {
    await pb.collection('app_settings').create({
      key: GLOBAL_KEY,
      settings: { general: { appName: 'smono' } },
    })
    console.log('✓ seeded global app_settings record')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
