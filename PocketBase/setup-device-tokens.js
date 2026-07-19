/**
 * device_tokens — FCM/APNs tokens for Capacitor (alongside Web Push push_subscriptions).
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

async function main() {
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  try {
    await pb.collections.create({
      name: 'device_tokens',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'platform',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['ios', 'android'],
        },
        { name: 'token', type: 'text', required: true },
        { name: 'active', type: 'bool' },
      ],
      listRule: '@request.auth.collectionName = "admin_users" || @request.auth.id = user',
      viewRule: '@request.auth.collectionName = "admin_users" || @request.auth.id = user',
      createRule: null,
      updateRule: null,
      deleteRule: '@request.auth.collectionName = "admin_users"',
    })
    console.log('✓ Created device_tokens')
  } catch (e) {
    if (e.status === 400) {
      console.log('⚠ device_tokens already exists — patching rules')
      const col = await pb.collections.getOne('device_tokens')
      await pb.collections.update(col.id, {
        listRule: '@request.auth.collectionName = "admin_users" || @request.auth.id = user',
        viewRule: '@request.auth.collectionName = "admin_users" || @request.auth.id = user',
        createRule: null,
        updateRule: null,
        deleteRule: '@request.auth.collectionName = "admin_users"',
      })
      console.log('✓ Patched device_tokens rules')
    } else throw e
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
