/**
 * Sync Google + Apple OAuth credentials from .env into PocketBase users collection.
 * Run on deploy when client ids/secrets are set. Skips missing providers (web unchanged).
 */
import PocketBase from 'pocketbase'
import { initPocketBase, loadEnv } from './utils.js'

const run = async () => {
  loadEnv()
  const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
  const pb = new PocketBase(PB_URL)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  const col = await pb.collections.getOne('users')
  const oauth2 = col.oauth2 || { enabled: false, providers: [] }
  const providers = [...(oauth2.providers || [])]

  const upsert = (name, clientId, clientSecret) => {
    if (!clientId || !clientSecret) return false
    const entry = { name, clientId, clientSecret }
    const idx = providers.findIndex((p) => p.name === name)
    if (idx >= 0) providers[idx] = { ...providers[idx], ...entry }
    else providers.push(entry)
    return true
  }

  const googleId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET
  const appleId = process.env.APPLE_CLIENT_ID || process.env.VITE_APPLE_CLIENT_ID
  const appleSecret = process.env.APPLE_CLIENT_SECRET

  const didGoogle = upsert('google', googleId, googleSecret)
  const didApple = upsert('apple', appleId, appleSecret)

  if (!didGoogle && !didApple) {
    console.log(
      '⚠ OAuth skipped — set Google (VITE_GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET) and/or Apple (APPLE_CLIENT_ID + APPLE_CLIENT_SECRET)'
    )
    return
  }

  await pb.collections.update('users', {
    oauth2: { ...oauth2, enabled: true, providers },
  })

  if (didGoogle) {
    const mask = `${String(googleId).slice(0, 12)}…${String(googleId).slice(-12)}`
    console.log(`✔ Google OAuth configured (${mask})`)
  } else {
    console.log('⚠ Google OAuth left unchanged (credentials missing)')
  }
  if (didApple) {
    const mask = `${String(appleId).slice(0, 12)}…`
    console.log(`✔ Apple OAuth configured (${mask})`)
  } else {
    console.log('⚠ Apple OAuth left unchanged (credentials missing)')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
