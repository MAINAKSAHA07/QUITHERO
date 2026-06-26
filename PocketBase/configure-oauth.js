import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

async function run() {
  try {
    console.log(`Configuring Google OAuth2 on PocketBase: ${PB_URL}`)
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✓ Authenticated as admin')

    // Get the users collection
    const usersCollection = await pb.collections.getOne('users')
    console.log('✓ Retrieved "users" collection')

    // Update the oauth2 configuration
    const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET

    if (!googleClientId || !googleClientSecret) {
      console.error('❌ Error: VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET must be set in .env')
      process.exit(1)
    }

    // Set the OAuth2 config
    usersCollection.oauth2 = {
      enabled: true,
      providers: [
        {
          name: 'google',
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }
      ]
    }

    // Save the collection
    await pb.collections.update(usersCollection.id, usersCollection)
    console.log('✓ Successfully configured Google OAuth2!')
  } catch (error) {
    console.error('❌ Configuration failed:', error.message)
    if (error.response) {
      console.error(JSON.stringify(error.response, null, 2))
    }
  }
}

run()
