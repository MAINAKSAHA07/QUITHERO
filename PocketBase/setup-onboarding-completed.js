/**
 * Add user_profiles.onboarding_completed_at (KYC completion marker).
 * Run: node PocketBase/setup-onboarding-completed.js
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url, email, password } = initPocketBase()
const pb = new PocketBase(url)
await pb.collection('_superusers').authWithPassword(email, password)

const col = await pb.collections.getOne('user_profiles')
const fields = col.fields || col.schema || []
const has = fields.some((f) => f.name === 'onboarding_completed_at')
if (has) {
  console.log('✓ user_profiles.onboarding_completed_at already exists')
  process.exit(0)
}

fields.push({
  name: 'onboarding_completed_at',
  type: 'date',
  required: false,
  options: {},
})

await pb.collections.update(col.id, { fields })
console.log('✔ added user_profiles.onboarding_completed_at')
