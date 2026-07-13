import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'

// helper to set owner rule based on a user field name
const ownerRule = (field) => `@request.auth.id = ${field}`
const ownerOrNullRule = (field) => `(${field} = null) || (@request.auth.id = ${field})`
const adminOrOwner = (field) => `${adminRule} || @request.auth.id = ${field}`

const configs = [
  // built-in auth users collection
  {
    name: 'users',
    // Only admin_users can list/search all users
    list: adminRule,
    // Admins can view any user; a logged-in user can view their own record
    view: `${adminRule} || @request.auth.id = id`,
    // User creation is handled via auth endpoints, so keep create rule open
    create: '',
    // Admins can update any user; a user can update their own record
    update: `${adminRule} || @request.auth.id = id`,
    // Only admin_users can delete users
    delete: adminRule,
  },
  // user-owned collections — admins can read/write all for backoffice dashboards
  { name: 'user_profiles', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'user_sessions', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'session_progress', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'step_responses', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'cravings', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'journal_entries', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'progress_stats', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'user_achievements', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'analytics_events', list: `${adminRule} || ${ownerOrNullRule('user')}`, view: `${adminRule} || ${ownerOrNullRule('user')}`, create: ownerOrNullRule('user'), update: adminRule, delete: adminRule },
  { name: 'support_tickets', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'session_ai_memory', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'personalization_logs', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'user_behavior_profiles', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'notification_events', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'smoke_check_ins', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },
  { name: 'belief_assessments', list: adminOrOwner('user'), view: adminOrOwner('user'), create: adminOrOwner('user'), update: adminOrOwner('user'), delete: adminRule },

  // public-readable (mobile app), admin-writable
  { name: 'programs', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'program_days', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'steps', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'achievements', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'content_items', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'content_chunks', list: adminRule, view: adminRule, create: adminRule, update: adminRule, delete: adminRule },
  { name: 'quotes', list: '', view: '', create: adminRule, update: adminRule, delete: adminRule },
  { name: 'media', list: adminRule, view: adminRule, create: adminRule, update: adminRule, delete: adminRule },
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
