import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const FRONTEND_ORIGINS = [
  process.env.PUBLIC_URL,
  process.env.VITE_APP_URL,
  'https://quithero.netlify.app',
  'http://localhost:5175',
].filter(Boolean)

function unique(items) {
  return [...new Set(items.map((s) => s.replace(/\/$/, '')))]
}

function printGoogleConsoleInstructions() {
  const origins = unique(FRONTEND_ORIGINS)
  const redirectUris = unique([
    ...origins.map((o) => `${o}/api/pocketbase/api/oauth2-redirect`),
    `${PB_URL.replace(/\/$/, '')}/api/oauth2-redirect`,
    'http://localhost:8096/api/oauth2-redirect',
  ])

  console.log('\n--- Google Cloud Console setup (APIs & Services → Credentials) ---')
  console.log('Create a Web application OAuth client for Quit Hero (do NOT reuse n8n keys).\n')
  console.log('Authorized JavaScript origins:')
  for (const o of origins) console.log(`  ${o}`)
  console.log('  http://localhost:5175')
  console.log('\nAuthorized redirect URIs:')
  for (const u of redirectUris) console.log(`  ${u}`)
  console.log('\nOAuth consent screen:')
  console.log('  - Add test users while in Testing mode, or Publish the app')
  console.log('  - Remove oauth-callback.html — PocketBase uses /api/oauth2-redirect')
  console.log('-------------------------------------------------------------------\n')
}

async function run() {
  try {
    console.log(`Configuring Google OAuth2 on PocketBase: ${PB_URL}`)
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✓ Authenticated as admin')

    const usersCollection = await pb.collections.getOne('users')

    const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const googleClientSecret =
      process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

    if (!googleClientId || !googleClientSecret) {
      console.error('❌ Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET in .env')
      printGoogleConsoleInstructions()
      process.exit(1)
    }

    usersCollection.oauth2 = {
      enabled: true,
      providers: [
        {
          name: 'google',
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      ],
    }

    await pb.collections.update(usersCollection.id, usersCollection)
    console.log('✓ Google OAuth2 configured on PocketBase users collection')
    console.log(`  Client ID: ${googleClientId.slice(0, 12)}...`)
    printGoogleConsoleInstructions()
  } catch (error) {
    console.error('❌ Configuration failed:', error.message)
    if (error.response) {
      console.error(JSON.stringify(error.response, null, 2))
    }
    process.exit(1)
  }
}

run()
