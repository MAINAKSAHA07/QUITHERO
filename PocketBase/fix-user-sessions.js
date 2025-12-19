import PocketBase from 'pocketbase'

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'mainaksaha0807@gmail.com'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '8104760831'

const pb = new PocketBase(PB_URL)

const ownerRule = (field) => `@request.auth.id = ${field}`

async function fixUserSessions() {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✓ Authenticated as admin')

    // Check if collection exists
    let collection
    try {
      collection = await pb.collections.getOne('user_sessions')
      console.log('✓ Collection user_sessions exists')
    } catch (e) {
      console.error('✗ Collection user_sessions does not exist!')
      console.error('Please run setup-pocketbase.js first to create collections')
      process.exit(1)
    }

    // Set API rules
    const rule = ownerRule('user')
    await pb.collections.update(collection.id, {
      listRule: rule,
      viewRule: rule,
      createRule: rule,
      updateRule: rule,
      deleteRule: rule,
    })
    console.log('✓ API rules set for user_sessions')
    console.log(`  List/View/Create/Update/Delete Rule: ${rule}`)

    // Verify the rules
    const updated = await pb.collections.getOne('user_sessions')
    console.log('\n✓ Verification:')
    console.log(`  List Rule: ${updated.listRule || '(empty)'}`)
    console.log(`  View Rule: ${updated.viewRule || '(empty)'}`)
    console.log(`  Create Rule: ${updated.createRule || '(empty)'}`)
    console.log(`  Update Rule: ${updated.updateRule || '(empty)'}`)
    console.log(`  Delete Rule: ${updated.deleteRule || '(empty)'}`)

    console.log('\n✓ user_sessions collection fixed!')
  } catch (error) {
    console.error('✗ Error fixing user_sessions:', error)
    console.error('Details:', error.response || error.message || error)
    process.exit(1)
  }
}

fixUserSessions()
