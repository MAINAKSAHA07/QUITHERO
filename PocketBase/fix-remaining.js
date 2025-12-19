import PocketBase from 'pocketbase'

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'mainaksaha0807@gmail.com'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '8104760831'

const pb = new PocketBase(PB_URL)

const ids = {
  programs: 'pbc_2970041692',
  program_days: 'pbc_2979720551',
  steps: 'pbc_4284789913',
  user_sessions: 'pbc_2480489570',
  session_progress: 'pbc_3082955947',
  step_responses: 'pbc_3414791112',
  user_achievements: 'pbc_3424787181',
  achievements: 'pbc_2260351736',
  user_profiles: 'pbc_2190040129',
}

const target = {
  program_days: [
    { name: 'program', type: 'relation', required: true, collectionId: ids.programs, maxSelect: 1, cascadeDelete: true },
    { name: 'day_number', type: 'number', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'estimated_duration_min', type: 'number' },
    { name: 'is_locked', type: 'bool' },
  ],
  steps: [
    { name: 'program_day', type: 'relation', required: true, collectionId: ids.program_days, maxSelect: 1, cascadeDelete: true },
    { name: 'order', type: 'number', required: true },
    { name: 'type', type: 'select', required: true, values: ['text', 'question_mcq', 'question_open', 'exercise', 'video', 'audio'] },
    { name: 'content_json', type: 'json', required: true },
  ],
  user_sessions: [
    { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'program', type: 'relation', required: true, collectionId: ids.programs, maxSelect: 1 },
    { name: 'current_day', type: 'number' },
    { name: 'status', type: 'select', required: true, values: ['not_started', 'in_progress', 'completed'] },
    { name: 'started_at', type: 'date' },
    { name: 'completed_at', type: 'date' },
  ],
  session_progress: [
    { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'program_day', type: 'relation', required: true, collectionId: ids.program_days, maxSelect: 1 },
    { name: 'status', type: 'select', required: true, values: ['not_started', 'in_progress', 'completed'] },
    { name: 'last_step_index', type: 'number' },
    { name: 'completed_at', type: 'date' },
    { name: 'time_spent_minutes', type: 'number' },
  ],
  step_responses: [
    { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'step', type: 'relation', required: true, collectionId: ids.steps, maxSelect: 1 },
    { name: 'response_json', type: 'json' },
  ],
  user_achievements: [
    { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'achievement', type: 'relation', required: true, collectionId: ids.achievements, maxSelect: 1 },
    { name: 'unlocked_at', type: 'date' },
    { name: 'unlock_method', type: 'select', values: ['automatic', 'manual'] },
    { name: 'reason', type: 'text' },
  ],
  audit_logs: [
    { name: 'admin_user', type: 'relation', collectionId: 'admin_users', maxSelect: 1 },
    { name: 'action', type: 'text', required: true },
    { name: 'action_type', type: 'select', values: ['user_management', 'content_management', 'settings_changes', 'support_actions', 'deletions', 'login_logout', 'permission_changes'] },
    { name: 'entity_type', type: 'text' },
    { name: 'entity_id', type: 'text' },
    { name: 'details', type: 'json' },
    { name: 'ip_address', type: 'text' },
    { name: 'user_agent', type: 'text' },
    { name: 'timestamp', type: 'date' },
  ],
}

function buildFields(existing, desired) {
  const idField = existing.fields.find(f => f.primaryKey) || existing.fields[0]
  const fields = [idField]
  for (const f of desired) {
    const base = {
      name: f.name,
      type: f.type,
      required: !!f.required,
      system: false,
      hidden: false,
      presentable: false,
    }
    if (f.type === 'relation') {
      base.collectionId = f.collectionId
      base.maxSelect = f.maxSelect || 1
      base.cascadeDelete = !!f.cascadeDelete
    }
    if (f.type === 'select') {
      base.values = f.values || []
      base.maxSelect = f.maxSelect || 1
    }
    if (f.type === 'number') {
      base.min = f.min ?? null
      base.max = f.max ?? null
      base.onlyInt = false
    }
    if (f.type === 'text') {
      base.min = f.min || 0
      base.max = f.max || 0
      base.pattern = ''
      base.autogeneratePattern = ''
    }
    if (f.type === 'url') base.onlyDomains = []
    fields.push(base)
  }
  return fields
}

const run = async () => {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  for (const [name, defs] of Object.entries(target)) {
    const existing = await pb.collections.getOne(name)
    try {
      const updated = await pb.collections.update(name, { name, fields: buildFields(existing, defs) })
      console.log('✔ fixed', updated.name)
    } catch (err) {
      console.error('✗ failed', name, err?.response || err?.message)
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); })
