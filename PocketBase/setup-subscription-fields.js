/**
 * Ensure user_profiles has subscription entitlement fields.
 * Run: node PocketBase/setup-subscription-fields.js
 */
import PocketBase from 'pocketbase'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const s = t.startsWith('export ') ? t.slice(7) : t
    const eq = s.indexOf('=')
    if (eq === -1) continue
    const key = s.slice(0, eq).trim()
    let val = s.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

loadEnv(join(root, '.env'))

const url = (
  process.env.AWS_POCKETBASE_URL ||
  process.env.VITE_POCKETBASE_URL ||
  'http://127.0.0.1:8096'
).replace(/\/$/, '')

const email = process.env.AWS_PB_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL
const password = process.env.AWS_PB_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD

const NEEDED = [
  {
    name: 'subscription_status',
    type: 'select',
    required: false,
    values: ['free', 'active', 'expired'],
    maxSelect: 1,
  },
  { name: 'subscription_started_at', type: 'date', required: false },
  { name: 'subscription_country', type: 'text', required: false },
]

async function main() {
  if (!email || !password) {
    console.error('Missing PB admin credentials')
    process.exit(1)
  }
  const pb = new PocketBase(url)
  await pb.collection('_superusers').authWithPassword(email, password)

  const col = await pb.collections.getOne('user_profiles')
  const fields = [...(col.fields || [])]
  const existing = new Set(fields.map((f) => f.name))
  let added = 0

  for (const spec of NEEDED) {
    if (existing.has(spec.name)) {
      console.log(`ok  ${spec.name}`)
      continue
    }
    fields.push(spec)
    added++
    console.log(`+   ${spec.name}`)
  }

  if (added === 0) {
    console.log('All subscription fields already present')
    return
  }

  await pb.collections.update(col.id, { fields })
  console.log(`Updated user_profiles (+${added} fields)`)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
