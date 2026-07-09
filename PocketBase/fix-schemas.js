import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const desired = {
  programs: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'is_active', type: 'bool' },
    { name: 'language', type: 'select', required: true, values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] },
    { name: 'duration_days', type: 'number' },
    { name: 'order', type: 'number' },
    { name: 'slug', type: 'text' },
    { name: 'method_name', type: 'text' },
  ],
  program_days: [
    { name: 'program', type: 'relation', required: true, collection: 'programs', maxSelect: 1, cascadeDelete: true },
    { name: 'day_number', type: 'number', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'estimated_duration_min', type: 'number' },
    { name: 'is_locked', type: 'bool' },
    { name: 'slug', type: 'text' },
    { name: 'cbt_technique', type: 'text' },
    { name: 'day_theme', type: 'text' },
  ],
  steps: [
    { name: 'program_day', type: 'relation', required: true, collection: 'program_days', maxSelect: 1, cascadeDelete: true },
    { name: 'order', type: 'number', required: true },
    { name: 'type', type: 'select', required: true, values: ['text', 'question_mcq', 'question_open', 'exercise', 'video', 'audio'] },
    { name: 'content_json', type: 'json', required: true },
    { name: 'slug', type: 'text' },
    { name: 'module_key', type: 'text' },
    { name: 'step_title', type: 'text' },
    { name: 'plain_text', type: 'text' },
    { name: 'content_role', type: 'select', values: ['intro', 'lesson', 'exercise', 'tool', 'reflection', 'preview', 'metadata'] },
    { name: 'cbt_technique', type: 'text' },
  ],
  user_profiles: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'age', type: 'number' },
    { name: 'gender', type: 'select', values: ['male', 'female', 'other', 'prefer_not_to_say'] },
    { name: 'language', type: 'select', required: true, values: ['en', 'es', 'fr', 'hi', 'de', 'zh', 'mr', 'gu', 'it'] },
    { name: 'quit_date', type: 'date', required: true },
    { name: 'daily_reminder_time', type: 'text' },
    { name: 'timezone', type: 'text' },
    { name: 'nicotine_forms', type: 'json' },
    { name: 'how_long_using', type: 'number' },
    { name: 'daily_consumption', type: 'number' },
    { name: 'consumption_unit', type: 'select', values: ['cigarettes', 'ml', 'grams'] },
    { name: 'motivations', type: 'json' },
    { name: 'enable_reminders', type: 'bool' },
    { name: 'smoking_triggers', type: 'json' },
    { name: 'emotional_states', type: 'json' },
    { name: 'fear_index', type: 'number' },
    { name: 'quit_reason', type: 'text' },
    { name: 'quit_archetype', type: 'select', values: ['escapist', 'stress_reactor', 'social_mirror', 'auto_pilot'] },
    { name: 'onboarding_name', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'pack_cost', type: 'number' },
    { name: 'minutes_per_cigarette', type: 'number' },
    { name: 'started_age_range', type: 'text' },
    { name: 'first_use_after_waking', type: 'text' },
    { name: 'smoking_times', type: 'json' },
    { name: 'smoking_environments', type: 'json' },
    { name: 'primary_trigger', type: 'text' },
    { name: 'craving_peak_time', type: 'text' },
    { name: 'daily_stress_level', type: 'text' },
    { name: 'anxiety_social_pattern', type: 'text' },
    { name: 'guilt_frequency', type: 'text' },
    { name: 'tried_quitting_before', type: 'text' },
    { name: 'previous_attempt_difficulty', type: 'json' },
    { name: 'quit_attempt_count', type: 'text' },
    { name: 'past_quit_tools', type: 'json' },
    { name: 'primary_motivation', type: 'text' },
    { name: 'priority_goal', type: 'text' },
    { name: 'quit_goal_style', type: 'text' },
    { name: 'quit_confidence', type: 'text' },
    { name: 'cravings_worry', type: 'text' },
    { name: 'relapse_worry', type: 'text' },
    { name: 'withdrawal_worry', type: 'text' },
    { name: 'household_smokers', type: 'text' },
    { name: 'occupation_style', type: 'text' },
    { name: 'reminder_frequency', type: 'text' },
    { name: 'support_preference', type: 'text' },
    { name: 'checkin_time_preference', type: 'text' },
    { name: 'success_outcome', type: 'text' },
    { name: 'commitment_statement', type: 'text' },
    { name: 'secondary_quit_archetype', type: 'text' },
    { name: 'readiness_score', type: 'number' },
    { name: 'relapse_risk_score', type: 'number' },
    { name: 'support_intensity_score', type: 'number' },
    { name: 'onboarding_completed_at', type: 'date' },
  ],
  user_sessions: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'program', type: 'relation', required: true, collection: 'programs', maxSelect: 1 },
    { name: 'current_day', type: 'number' },
    { name: 'status', type: 'select', required: true, values: ['not_started', 'in_progress', 'completed'] },
    { name: 'started_at', type: 'date' },
    { name: 'completed_at', type: 'date' },
  ],
  session_progress: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'program_day', type: 'relation', required: true, collection: 'program_days', maxSelect: 1 },
    { name: 'status', type: 'select', required: true, values: ['not_started', 'in_progress', 'completed'] },
    { name: 'last_step_index', type: 'number' },
    { name: 'completed_at', type: 'date' },
    { name: 'time_spent_minutes', type: 'number' },
  ],
  step_responses: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'step', type: 'relation', required: true, collection: 'steps', maxSelect: 1 },
    { name: 'response_json', type: 'json' },
  ],
  cravings: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'type', type: 'select', required: true, values: ['craving', 'slip'] },
    { name: 'intensity', type: 'number', min: 1, max: 5 },
    { name: 'trigger', type: 'select', values: ['stress', 'boredom', 'social', 'habit', 'other'] },
    { name: 'trigger_custom', type: 'text' },
    { name: 'notes', type: 'text' },
  ],
  journal_entries: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'date', type: 'date', required: true },
    { name: 'mood', type: 'select', values: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'] },
    { name: 'title', type: 'text' },
    { name: 'content', type: 'text' },
  ],
  progress_stats: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'days_smoke_free', type: 'number' },
    { name: 'cigarettes_not_smoked', type: 'number' },
    { name: 'money_saved', type: 'number' },
    { name: 'life_regained_hours', type: 'number' },
    { name: 'health_improvement_percent', type: 'number' },
    { name: 'last_calculated', type: 'date' },
  ],
  achievements: [
    { name: 'key', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'icon', type: 'text' },
    { name: 'tier', type: 'select', values: ['bronze', 'silver', 'gold', 'platinum'] },
    { name: 'requirement_type', type: 'select', values: ['days_streak', 'cravings_resisted', 'sessions_completed', 'slips_under_threshold', 'journal_entries'] },
    { name: 'requirement_value', type: 'number' },
    { name: 'is_active', type: 'bool' },
    { name: 'order', type: 'number' },
  ],
  user_achievements: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
    { name: 'achievement', type: 'relation', required: true, collection: 'achievements', maxSelect: 1 },
    { name: 'unlocked_at', type: 'date' },
    { name: 'unlock_method', type: 'select', values: ['automatic', 'manual'] },
    { name: 'reason', type: 'text' },
  ],
  analytics_events: [
    { name: 'user', type: 'relation', required: false, collection: '_pb_users_auth_', maxSelect: 1 },
    { name: 'event_type', type: 'text', required: true },
    { name: 'meta', type: 'json' },
  ],
  content_items: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'text' },
    { name: 'type', type: 'select', values: ['article', 'blog', 'guide', 'quote', 'tip'] },
    { name: 'language', type: 'select', values: ['en', 'es', 'fr', 'hi'] },
    { name: 'status', type: 'select', values: ['draft', 'published', 'archived'] },
    { name: 'image_url', type: 'text' },
    { name: 'is_active', type: 'bool' },
    { name: 'order', type: 'number' },
  ],
  support_tickets: [
    { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1 },
    { name: 'subject', type: 'text', required: true },
    { name: 'message', type: 'text' },
    { name: 'description', type: 'text' },
    { name: 'status', type: 'select', required: true, values: ['open', 'in_progress', 'resolved', 'closed'] },
    { name: 'priority', type: 'select', values: ['low', 'medium', 'high', 'urgent'] },
    { name: 'category', type: 'select', values: ['technical', 'content', 'billing', 'other'] },
    { name: 'assigned_to', type: 'relation', collection: '_pb_users_auth_', maxSelect: 1 },
  ],
  notification_templates: [
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'select', required: true, values: ['email', 'push', 'sms'] },
    { name: 'trigger_event', type: 'text', required: true },
    { name: 'language', type: 'select', required: true, values: ['en', 'es', 'fr', 'hi'] },
    { name: 'is_active', type: 'bool' },
    { name: 'subject', type: 'text' },
    { name: 'content', type: 'text' },
    { name: 'from_name', type: 'text' },
    { name: 'from_email', type: 'text' },
  ],
  quotes: [
    { name: 'type', type: 'select', required: true, values: ['quote', 'tip'] },
    { name: 'content', type: 'text', required: true },
    { name: 'author', type: 'text' },
    { name: 'language', type: 'select', required: true, values: ['en', 'es', 'fr', 'hi'] },
    { name: 'is_active', type: 'bool' },
  ],
  media: [
    { name: 'filename', type: 'text', required: true },
    { name: 'type', type: 'select', required: true, values: ['image', 'video', 'audio', 'document', 'other'] },
    { name: 'file', type: 'file', maxSize: 104857600 },
    { name: 'url', type: 'url' },
    { name: 'size', type: 'number' },
    { name: 'folder', type: 'text' },
  ],
  api_keys: [
    { name: 'name', type: 'text', required: true },
    { name: 'key', type: 'text', required: true },
    { name: 'permissions', type: 'json' },
    { name: 'status', type: 'select', required: true, values: ['active', 'revoked'] },
    { name: 'last_used', type: 'date' },
    { name: 'expires_at', type: 'date' },
  ],
  webhooks: [
    { name: 'url', type: 'url', required: true },
    { name: 'events', type: 'json' },
    { name: 'status', type: 'select', required: true, values: ['active', 'inactive'] },
    { name: 'secret', type: 'text' },
  ],
  audit_logs: [
    { name: 'admin_user', type: 'relation', collection: 'admin_users', maxSelect: 1 },
    { name: 'action', type: 'text', required: true },
    { name: 'action_type', type: 'select', values: ['user_management', 'content_management', 'settings_changes', 'support_actions', 'deletions', 'login_logout', 'permission_changes'] },
    { name: 'entity_type', type: 'text' },
    { name: 'entity_id', type: 'text' },
    { name: 'details', type: 'json' },
    { name: 'ip_address', type: 'text' },
    { name: 'user_agent', type: 'text' },
    { name: 'timestamp', type: 'date' },
  ],
  admin_users: [
    { name: 'name', type: 'text' },
    { name: 'role', type: 'select', values: ['admin', 'editor', 'support'] },
  ],
}

function buildFieldsWithId(existing) {
  const idField = existing?.fields?.find(f => f.primaryKey) || {
    name: 'id',
    type: 'text',
    required: true,
    system: true,
    primaryKey: true,
    hidden: false,
    presentable: false,
    autogeneratePattern: '[a-z0-9]{15}',
    min: 15,
    max: 15,
    pattern: '^[a-z0-9]+$'
  }
  return [idField]
}

function toField(f) {
  const base = {
    name: f.name,
    type: f.type,
    required: !!f.required,
    system: false,
    hidden: false,
    presentable: false,
  }
  if (f.type === 'relation') {
    base.collectionId = f.collection
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
  if (f.type === 'url') {
    base.onlyDomains = []
  }
  return base
}

const run = async () => {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  for (const [name, fields] of Object.entries(desired)) {
    const current = await pb.collections.getOne(name)
    const newFields = buildFieldsWithId(current)
    fields.forEach(f => newFields.push(toField(f)))
    try {
      await pb.collections.update(name, { name, fields: newFields })
      console.log('✔ updated', name)
    } catch (err) {
      console.error('✗ failed', name, err?.response || err?.message || err)
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); })
