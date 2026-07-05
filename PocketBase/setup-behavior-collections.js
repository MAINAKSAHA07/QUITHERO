/**
 * Creates PocketBase collections for the OKF Behavioral AI system:
 * - user_behavior_profiles
 * - notification_events
 * - personalization_logs
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()

const pb = new PocketBase(PB_URL)

async function main() {
  console.log(`Connecting to PocketBase at ${PB_URL}`)
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('Authenticated as superadmin')

  // 1. user_behavior_profiles
  try {
    await pb.collections.create({
      name: 'user_behavior_profiles',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'peak_active_hour', type: 'number' },
        { name: 'peak_active_hour_2', type: 'number' },
        { name: 'craving_peak_hour', type: 'number' },
        { name: 'avg_session_minutes', type: 'number' },
        { name: 'preferred_step_types', type: 'json' },
        { name: 'typical_dropout_step', type: 'number' },
        { name: 'dominant_trigger', type: 'text' },
        { name: 'avg_craving_intensity', type: 'number' },
        { name: 'intensity_trend', type: 'text' },
        { name: 'mood_trend', type: 'text' },
        { name: 'assigned_archetype', type: 'text' },
        { name: 'behavioral_archetype', type: 'text' },
        { name: 'archetype_confidence', type: 'number' },
        { name: 'best_notification_hour', type: 'number' },
        { name: 'best_notification_style', type: 'text' },
        { name: 'notification_open_rate', type: 'number' },
        { name: 'learning_phase', type: 'text' },
        { name: 'days_observed', type: 'number' },
        { name: 'last_updated', type: 'date' },
      ],
      listRule: '@request.auth.id = user',
      viewRule: '@request.auth.id = user',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
    })
    console.log('✓ Created user_behavior_profiles collection')
  } catch (e) {
    if (e.status === 400) console.log('⚠ user_behavior_profiles already exists')
    else console.log('user_behavior_profiles error:', e.message)
  }

  // 2. notification_events
  try {
    await pb.collections.create({
      name: 'notification_events',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'trigger_type', type: 'text', required: true },
        { name: 'message_title', type: 'text', required: true },
        { name: 'message_body', type: 'text', required: true },
        { name: 'archetype_at_send', type: 'text' },
        { name: 'day_number', type: 'number' },
        { name: 'sent_at', type: 'date' },
        { name: 'opened_at', type: 'date' },
        { name: 'led_to_session', type: 'bool' },
      ],
      listRule: '@request.auth.id = user',
      viewRule: '@request.auth.id = user',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
    })
    console.log('✓ Created notification_events collection')
  } catch (e) {
    if (e.status === 400) console.log('⚠ notification_events already exists')
    else console.log('notification_events error:', e.message)
  }

  // 3. personalization_logs
  try {
    await pb.collections.create({
      name: 'personalization_logs',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'day_number', type: 'number' },
        { name: 'request_type', type: 'text' },
        { name: 'archetype_used', type: 'text' },
        { name: 'okf_docs_loaded', type: 'json' },
        { name: 'ai_response_summary', type: 'text' },
        { name: 'content_fit_score', type: 'number' },
      ],
      listRule: '@request.auth.id = user',
      viewRule: '@request.auth.id = user',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
    })
    console.log('✓ Created personalization_logs collection')
  } catch (e) {
    if (e.status === 400) console.log('⚠ personalization_logs already exists')
    else console.log('personalization_logs error:', e.message)
  }

  console.log('\n✅ All OKF behavioral collections ready')
}

main().catch(console.error)
