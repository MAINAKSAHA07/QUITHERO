import PocketBase from 'pocketbase'

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'mainaksaha0807@gmail.com'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '8104760831'

const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'

// helper to set owner rule based on a user field name
const ownerRule = (field) => `@request.auth.id = ${field}`
const ownerOrNullRule = (field) => `(${field} = null) || (@request.auth.id = ${field})`

const configs = [
  // user-owned collections
  { name: 'user_profiles', rule: ownerRule('user') },
  { name: 'user_sessions', rule: ownerRule('user') },
  { name: 'session_progress', rule: ownerRule('user') },
  { name: 'step_responses', rule: ownerRule('user') },
  { name: 'cravings', rule: ownerRule('user') },
  { name: 'journal_entries', rule: ownerRule('user') },
  { name: 'progress_stats', rule: ownerRule('user') },
  { name: 'user_achievements', rule: ownerRule('user') },
  { name: 'analytics_events', rule: ownerOrNullRule('user') },
  { name: 'support_tickets', rule: ownerRule('user') },

  // public-readable, admin-writable
  { name: 'programs', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'program_days', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'steps', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'achievements', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'content_items', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'quotes', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'media', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'api_keys', list: adminRule, view: adminRule, create: adminRule, update: adminRule, delete: adminRule },
  { name: 'webhooks', list: adminRule, view: adminRule, create: adminRule, update: adminRule, delete: adminRule },
  { name: 'notification_templates', list: adminRule, view: adminRule, create: adminRule, update: adminRule, delete: adminRule },
  { name: 'audit_logs', list: adminRule, view: adminRule, create: adminRule, update: adminRule, delete: adminRule },
  { name: 'admin_users', list: adminRule, view: adminRule, create: adminRule, update: adminRule, delete: adminRule },
]

const applyRule = async (name, {list, view, create, update, del, rule}) => {
  const col = await pb.collections.getOne(name)
  const payload = {
    listRule: list ?? rule,
    viewRule: view ?? rule,
    createRule: create ?? rule,
    updateRule: update ?? rule,
    deleteRule: del ?? rule,
  }
  await pb.collections.update(col.id, payload)
  console.log(`✔ rules set for ${name}`)
}

const run = async () => {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  for (const cfg of configs) {
    try {
      await applyRule(cfg.name, cfg)
    } catch (err) {
      console.error(`✗ rules failed for ${cfg.name}`, err?.response || err?.message || err)
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); })
