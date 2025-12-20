#!/usr/bin/env node

/**
 * PocketBase Database Setup Script
 * This script creates all necessary collections for both Frontend and Backoffice
 * Run: npm run pb:setup
 * Or: node PocketBase/setup-pocketbase.js
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

// Collection definitions - Aligned with Frontend and Backoffice requirements
const collections = [
  // Backoffice admin auth collection (custom auth for backoffice)
  {
    name: 'admin_users',
    type: 'auth',
    schema: [
      { name: 'name', type: 'text', options: {} },
      { name: 'role', type: 'select', options: { values: ['admin', 'editor', 'support'] } },
    ],
  },
  // ========== FRONTEND COLLECTIONS ==========
  {
    name: 'user_profiles',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'age', type: 'number', options: {} },
      { name: 'gender', type: 'select', options: { values: ['male', 'female', 'other', 'prefer_not_to_say'] } },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] }, required: true },
      { name: 'quit_date', type: 'date', options: {}, required: true },
      { name: 'daily_reminder_time', type: 'text', options: {} },
      { name: 'nicotine_forms', type: 'json', options: {} },
      { name: 'how_long_using', type: 'number', options: {} },
      { name: 'daily_consumption', type: 'number', options: {} },
      { name: 'consumption_unit', type: 'select', options: { values: ['cigarettes', 'ml', 'grams'] } },
      { name: 'motivations', type: 'json', options: {} },
      { name: 'enable_reminders', type: 'bool', options: { defaultValue: true } },
      // New onboarding personalization fields
      { name: 'smoking_triggers', type: 'json', options: {} }, // Array of triggers
      { name: 'emotional_states', type: 'json', options: {} }, // Array of emotional states
      { name: 'fear_index', type: 'number', options: { min: 0, max: 10 } }, // 0-10 scale
      { name: 'quit_reason', type: 'text', options: {} }, // Free text
      { name: 'quit_archetype', type: 'select', options: { values: ['escapist', 'stress_reactor', 'social_mirror', 'auto_pilot'] } },
    ],
    indexes: [{ fields: ['user'], unique: true }],
  },
  {
    name: 'programs',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'description', type: 'text', options: {} },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] }, required: true },
      { name: 'duration_days', type: 'number', options: { defaultValue: 10 } },
      { name: 'order', type: 'number', options: {} },
    ],
  },
  {
    name: 'program_days',
    type: 'base',
    schema: [
      { name: 'program', type: 'relation', options: { collectionId: 'programs', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'day_number', type: 'number', options: {}, required: true },
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'subtitle', type: 'text', options: {} },
      { name: 'estimated_duration_min', type: 'number', options: {} },
      { name: 'is_locked', type: 'bool', options: { defaultValue: false } },
    ],
  },
  {
    name: 'steps',
    type: 'base',
    schema: [
      { name: 'program_day', type: 'relation', options: { collectionId: 'program_days', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'order', type: 'number', options: {}, required: true },
      { name: 'type', type: 'select', options: { values: ['text', 'question_mcq', 'question_open', 'exercise', 'video', 'audio'] }, required: true },
      { name: 'content_json', type: 'json', options: {}, required: true },
    ],
  },
  {
    name: 'user_sessions',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'program', type: 'relation', options: { collectionId: 'programs', maxSelect: 1 }, required: true },
      { name: 'current_day', type: 'number', options: { defaultValue: 1 } },
      { name: 'status', type: 'select', options: { values: ['not_started', 'in_progress', 'completed'] }, required: true },
      { name: 'started_at', type: 'date', options: {} },
      { name: 'completed_at', type: 'date', options: {} },
    ],
  },
  {
    name: 'session_progress',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'program_day', type: 'relation', options: { collectionId: 'program_days', maxSelect: 1 }, required: true },
      { name: 'status', type: 'select', options: { values: ['not_started', 'in_progress', 'completed'] }, required: true },
      { name: 'last_step_index', type: 'number', options: { defaultValue: 0 } },
      { name: 'completed_at', type: 'date', options: {} },
      { name: 'time_spent_minutes', type: 'number', options: { defaultValue: 0 } },
    ],
  },
  {
    name: 'step_responses',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'step', type: 'relation', options: { collectionId: 'steps', maxSelect: 1 }, required: true },
      { name: 'response_json', type: 'json', options: {} },
    ],
  },
  {
    name: 'cravings',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'type', type: 'select', options: { values: ['craving', 'slip'] }, required: true },
      { name: 'intensity', type: 'number', options: { min: 1, max: 5 } },
      { name: 'trigger', type: 'select', options: { values: ['stress', 'boredom', 'social', 'habit', 'other'] } },
      { name: 'trigger_custom', type: 'text', options: {} },
      { name: 'notes', type: 'text', options: {} },
    ],
  },
  {
    name: 'journal_entries',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'date', type: 'date', options: {}, required: true },
      { name: 'mood', type: 'select', options: { values: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'] } },
      { name: 'title', type: 'text', options: {} },
      { name: 'content', type: 'text', options: {} },
    ],
  },
  {
    name: 'progress_stats',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'days_smoke_free', type: 'number', options: { defaultValue: 0 } },
      { name: 'cigarettes_not_smoked', type: 'number', options: { defaultValue: 0 } },
      { name: 'money_saved', type: 'number', options: { defaultValue: 0 } },
      { name: 'life_regained_hours', type: 'number', options: { defaultValue: 0 } },
      { name: 'health_improvement_percent', type: 'number', options: { defaultValue: 0 } },
      { name: 'last_calculated', type: 'date', options: {} },
    ],
    indexes: [{ fields: ['user'], unique: true }],
  },
  {
    name: 'achievements',
    type: 'base',
    schema: [
      { name: 'key', type: 'text', options: {}, required: true },
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'description', type: 'text', options: {} },
      { name: 'icon', type: 'text', options: {} },
      { name: 'tier', type: 'select', options: { values: ['bronze', 'silver', 'gold', 'platinum'] } },
      { name: 'requirement_type', type: 'select', options: { values: ['days_streak', 'cravings_resisted', 'sessions_completed', 'slips_under_threshold', 'journal_entries'] } },
      { name: 'requirement_value', type: 'number', options: {} },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'order', type: 'number', options: {} },
    ],
    indexes: [{ fields: ['key'], unique: true }],
  },
  {
    name: 'user_achievements',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }, required: true },
      { name: 'achievement', type: 'relation', options: { collectionId: 'achievements', maxSelect: 1 }, required: true },
      { name: 'unlocked_at', type: 'date', options: {} },
      { name: 'unlock_method', type: 'select', options: { values: ['automatic', 'manual'] } },
      { name: 'reason', type: 'text', options: {} },
    ],
  },
  {
    name: 'analytics_events',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
      { name: 'event_type', type: 'text', options: {}, required: true },
      { name: 'meta', type: 'json', options: {} },
    ],
  },
  {
    name: 'content_items',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', options: {}, required: true },
      { name: 'content', type: 'text', options: {} },
      { name: 'type', type: 'select', options: { values: ['article', 'blog', 'guide', 'quote', 'tip'] } },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi'] } },
      { name: 'status', type: 'select', options: { values: ['draft', 'published', 'archived'] } },
      { name: 'image_url', type: 'text', options: {} },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'order', type: 'number', options: {} },
    ],
  },
  // ========== BACKOFFICE COLLECTIONS ==========
  {
    name: 'support_tickets',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 }, required: true },
      { name: 'subject', type: 'text', options: {}, required: true },
      { name: 'message', type: 'text', options: {} },
      { name: 'description', type: 'text', options: {} },
      { name: 'status', type: 'select', options: { values: ['open', 'in_progress', 'resolved', 'closed'] }, required: true },
      { name: 'priority', type: 'select', options: { values: ['low', 'medium', 'high', 'urgent'] } },
      { name: 'category', type: 'select', options: { values: ['technical', 'content', 'billing', 'other'] } },
      { name: 'assigned_to', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
    ],
  },
  {
    name: 'notification_templates',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', options: {}, required: true },
      { name: 'type', type: 'select', options: { values: ['email', 'push', 'sms'] }, required: true },
      { name: 'trigger_event', type: 'text', options: {}, required: true },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi'] }, required: true },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
      { name: 'subject', type: 'text', options: {} },
      { name: 'content', type: 'text', options: {} },
      { name: 'from_name', type: 'text', options: {} },
      { name: 'from_email', type: 'text', options: {} },
    ],
  },
  {
    name: 'quotes',
    type: 'base',
    schema: [
      { name: 'type', type: 'select', options: { values: ['quote', 'tip'] }, required: true },
      { name: 'content', type: 'text', options: {}, required: true },
      { name: 'author', type: 'text', options: {} },
      { name: 'language', type: 'select', options: { values: ['en', 'es', 'fr', 'hi'] }, required: true },
      { name: 'is_active', type: 'bool', options: { defaultValue: true } },
    ],
  },
  {
    name: 'media',
    type: 'base',
    schema: [
      { name: 'filename', type: 'text', options: {}, required: true },
      { name: 'type', type: 'select', options: { values: ['image', 'video', 'audio', 'document', 'other'] }, required: true },
      { name: 'url', type: 'url', options: {} },
      { name: 'size', type: 'number', options: {} },
      { name: 'folder', type: 'text', options: {} },
    ],
  },
  {
    name: 'api_keys',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', options: {}, required: true },
      { name: 'key', type: 'text', options: {}, required: true },
      { name: 'permissions', type: 'json', options: {} },
      { name: 'status', type: 'select', options: { values: ['active', 'revoked'] }, required: true },
      { name: 'last_used', type: 'date', options: {} },
      { name: 'expires_at', type: 'date', options: {} },
    ],
    indexes: [{ fields: ['key'], unique: true }],
  },
  {
    name: 'webhooks',
    type: 'base',
    schema: [
      { name: 'url', type: 'url', options: {}, required: true },
      { name: 'events', type: 'json', options: {} },
      { name: 'status', type: 'select', options: { values: ['active', 'inactive'] }, required: true },
      { name: 'secret', type: 'text', options: {} },
    ],
  },
  {
    name: 'audit_logs',
    type: 'base',
    schema: [
      { name: 'admin_user', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
      { name: 'action', type: 'text', options: {}, required: true },
      { name: 'action_type', type: 'select', options: { values: ['user_management', 'content_management', 'settings_changes', 'support_actions', 'deletions', 'login_logout', 'permission_changes'] } },
      { name: 'entity_type', type: 'text', options: {} },
      { name: 'entity_id', type: 'text', options: {} },
      { name: 'details', type: 'json', options: {} },
      { name: 'ip_address', type: 'text', options: {} },
      { name: 'user_agent', type: 'text', options: {} },
      { name: 'timestamp', type: 'date', options: {} },
    ],
  },
]

async function createCollection(collectionDef) {
  try {
    // Check if collection already exists
    try {
      await pb.collections.getFirstListItem(`name="${collectionDef.name}"`)
      console.log(`✓ Collection "${collectionDef.name}" already exists, skipping...`)
      return { success: true, skipped: true }
    } catch (e) {
      // Collection doesn't exist, create it
    }

    // Transform schema to PocketBase format
    const schema = collectionDef.schema.map(field => {
      const fieldDef = {
        name: field.name,
        type: field.type,
        required: field.required || false,
      }

      // Add options based on field type
      if (field.type === 'relation') {
        fieldDef.options = {
          collectionId: field.options.collectionId,
          cascadeDelete: field.options.cascadeDelete || false,
          maxSelect: field.options.maxSelect || 1,
        }
      } else if (field.type === 'select') {
        fieldDef.options = {
          values: field.options.values || [],
        }
      } else if (field.type === 'number') {
        fieldDef.options = {
          min: field.options.min,
          max: field.options.max,
        }
      } else if (field.type === 'bool') {
        fieldDef.options = {
          defaultValue: field.options.defaultValue || false,
        }
      } else if (field.type === 'text' || field.type === 'json' || field.type === 'date' || field.type === 'url') {
        fieldDef.options = field.options || {}
      }

      return fieldDef
    })

    // Create collection
    const collection = await pb.collections.create({
      name: collectionDef.name,
      type: collectionDef.type || 'base',
      schema: schema,
    })

    // Add indexes if specified
    if (collectionDef.indexes && collectionDef.indexes.length > 0) {
      for (const index of collectionDef.indexes) {
        try {
          await pb.collections.createIndex(collection.id, {
            fields: index.fields,
            unique: index.unique || false,
          })
        } catch (idxError) {
          console.warn(`  ⚠ Could not create index for ${collectionDef.name}:`, idxError.message)
        }
      }
    }

    console.log(`✓ Created collection: ${collectionDef.name}`)
    return { success: true, collection }
  } catch (error) {
    console.error(`✗ Failed to create collection "${collectionDef.name}":`, error.message)
    if (error.response) {
      console.error(`  Response:`, JSON.stringify(error.response, null, 2))
    }
    return { success: false, error: error.message }
  }
}

async function setupDatabase() {
  console.log('🚀 Starting PocketBase database setup...\n')
  console.log(`📍 Connecting to: ${PB_URL}\n`)

  try {
    // Authenticate as admin
    console.log('📝 Authenticating as admin...')
    console.log(`  Using email: ${ADMIN_EMAIL}`)
    
    // Wait for PocketBase to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Try authentication with retries
    let authenticated = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
        authenticated = true
        console.log('✓ Admin authentication successful\n')
        break
      } catch (authError) {
        if (attempt < 3) {
          console.log(`  ⚠️  Attempt ${attempt} failed, retrying in 2 seconds...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          throw authError
        }
      }
    }
    
    if (!authenticated) {
      throw new Error('Failed to authenticate after all attempts')
    }
  } catch (error) {
    console.error('\n✗ Admin authentication failed.')
    const errorMsg = error?.message || ''
    const errorStatus = error?.status || error?.response?.status || error?.response?.code
    console.error(`  Error: ${errorMsg}`)
    console.error(`  Status: ${errorStatus || 'N/A'}`)
    console.error('\n  📋 Solutions:')
    console.error('     1. Make sure you have created the admin account via web interface:')
    console.error(`        http://localhost:8096/_/`)
    console.error(`     2. Verify credentials: ${ADMIN_EMAIL}`)
    console.error('     3. Check PocketBase logs: npm run pb:logs')
    console.error('     4. Then run this script again\n')
    process.exit(1)
  }

  // Create all collections
  console.log('📦 Creating collections...\n')
  const results = []
  for (const collectionDef of collections) {
    const result = await createCollection(collectionDef)
    results.push({ name: collectionDef.name, ...result })
  }

  // Create default backoffice admin user (custom auth collection)
  try {
    await pb.collection('admin_users').getFirstListItem('email = "admin@backoffice.com"')
    console.log('✓ Backoffice admin user already exists, skipping...')
  } catch (_) {
    await pb.collection('admin_users').create({
      email: 'admin@backoffice.com',
      password: 'Admin123!',
      passwordConfirm: 'Admin123!',
      name: 'Backoffice Admin',
      role: 'admin',
    })
    console.log('✓ Created backoffice admin user: admin@backoffice.com / Admin123!')
  }

  // Set permissive rules for admin_users on all collections
  const allowAdminUsersRule = '@request.auth.collectionName = \"admin_users\"'
  for (const col of results.filter(r => r.success && r.collection)) {
    try {
      await pb.collections.update(col.collection.id, {
        listRule: allowAdminUsersRule,
        viewRule: allowAdminUsersRule,
        createRule: allowAdminUsersRule,
        updateRule: allowAdminUsersRule,
        deleteRule: allowAdminUsersRule,
      })
    } catch (err) {
      console.warn(`  ⚠ Could not update rules for ${col.collection.name}:`, err?.message)
    }
  }

  // Summary
  console.log('\n📊 Setup Summary:')
  const created = results.filter(r => r.success && !r.skipped).length
  const skipped = results.filter(r => r.success && r.skipped).length
  const failed = results.filter(r => !r.success).length

  console.log(`  ✓ Created: ${created} collections`)
  console.log(`  ⊘ Skipped: ${skipped} collections (already exist)`)
  if (failed > 0) {
    console.log(`  ✗ Failed: ${failed} collections`)
  }

  console.log('\n✅ Database setup complete!')
  console.log('\n📝 Next steps:')
  console.log('  1. Configure collection API rules in PocketBase admin panel')
  console.log('  2. Set up permissions: Users can only CRUD their own records')
  console.log('  3. Seed initial data (programs, achievements, etc.)')
  console.log('\n💡 Access admin panel at http://localhost:8096/_/')
}

// Run setup
setupDatabase().catch(console.error)

