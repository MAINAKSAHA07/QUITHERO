/**
 * push_subscriptions — Web Push device endpoints for background notifications
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  try {
    await pb.collections.create({
      name: 'push_subscriptions',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: false, collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'endpoint', type: 'text', required: true },
        { name: 'subscription', type: 'json', required: true },
        { name: 'active', type: 'bool' },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    console.log('✓ Created push_subscriptions')
  } catch (e) {
    if (e.status === 400) console.log('⚠ push_subscriptions already exists')
    else throw e
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
