/**
 * Creates session_ai_memory collection and extends personalization_logs
 * with content_payload for full AI continuity.
 *
 * Run: npm run pb:setup-ai-memory
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const userOwnedRules = {
  listRule: '@request.auth.id = user',
  viewRule: '@request.auth.id = user',
  createRule: '@request.auth.id = user',
  updateRule: '@request.auth.id = user',
  deleteRule: '@request.auth.id = user',
}

async function resolveCollectionId(nameOrId) {
  if (nameOrId.startsWith('_') || nameOrId.length > 20) return nameOrId
  const col = await pb.collections.getFirstListItem(`name="${nameOrId}"`)
  return col.id
}

async function main() {
  console.log(`Connecting to PocketBase at ${PB_URL}`)
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('Authenticated as superadmin')

  const existing = await pb.collections.getFullList().then(cols => cols.find(c => c.name === 'session_ai_memory'))

  if (existing) {
    console.log('⚠ session_ai_memory already exists')
  } else {
    try {
      const usersId = await resolveCollectionId('_pb_users_auth_')
      const programDayId = await resolveCollectionId('program_days').catch(() => null)

      const fields = [
        { name: 'user', type: 'relation', required: true, collectionId: usersId, maxSelect: 1 },
        { name: 'day_number', type: 'number', required: true },
        {
          name: 'record_type',
          type: 'select',
          required: true,
          values: ['personalization', 'trigger_check', 'comprehension_check', 'comprehension_reread'],
        },
        { name: 'payload_json', type: 'json', required: true },
        { name: 'is_correct', type: 'bool' },
        { name: 'source', type: 'text' },
      ]

      if (programDayId) {
        fields.splice(2, 0, { name: 'program_day', type: 'relation', collectionId: programDayId, maxSelect: 1 })
      }

      await pb.collections.create({
        name: 'session_ai_memory',
        type: 'base',
        fields,
        ...userOwnedRules,
      })
      console.log('✓ Created session_ai_memory collection')
    } catch (e) {
      console.log('session_ai_memory error:', e.message)
      if (e.response?.data) console.log(JSON.stringify(e.response.data, null, 2))
    }
  }

  try {
    const cols = await pb.collections.getFullList()
    const logs = cols.find(c => c.name === 'personalization_logs')
    if (logs) {
      const names = (logs.fields || []).map(f => f.name)
      if (!names.includes('content_payload')) {
        await pb.collections.update(logs.id, {
          fields: [...logs.fields, { name: 'content_payload', type: 'json' }],
        })
        console.log('✓ Extended personalization_logs with content_payload')
      } else {
        console.log('⚠ personalization_logs.content_payload already exists')
      }
    }
  } catch (e) {
    console.log('personalization_logs extend:', e.message)
  }

  console.log('\n✅ AI memory collections ready')
}

main().catch(console.error)
