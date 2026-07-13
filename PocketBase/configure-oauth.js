/**
 * Sync Google OAuth credentials from .env into PocketBase users collection.
 * Run on deploy when VITE_GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set.
 */
import PocketBase from 'pocketbase'
import { initPocketBase, loadEnv } from './utils.js'

const run = async () => {
  loadEnv()
  const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log('⚠ Google OAuth skipped — set VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env')
    return
  }

  const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
  const pb = new PocketBase(PB_URL)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  const col = await pb.collections.getOne('users')
  const oauth2 = col.oauth2 || { enabled: false, providers: [] }
  const providers = [...(oauth2.providers || [])]
  const idx = providers.findIndex((p) => p.name === 'google')

  const google = {
    name: 'google',
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  }

  if (idx >= 0) {
    providers[idx] = { ...providers[idx], ...google }
  } else {
    providers.push(google)
  }

  await pb.collections.update('users', {
    oauth2: { ...oauth2, enabled: true, providers },
  })

  const mask = `${CLIENT_ID.slice(0, 12)}…${CLIENT_ID.slice(-20)}`
  console.log(`✔ Google OAuth configured on users collection (${mask})`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
