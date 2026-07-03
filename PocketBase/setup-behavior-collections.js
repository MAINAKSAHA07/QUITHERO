/**
 * Creates PocketBase collections for the OKF Behavioral AI system:
 * - user_behavior_profiles
 * - notification_events
 * - personalization_logs
 */

import PocketBase from 'pocketbase'

const PB_URL = process.env.AWS_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'
const ADMIN_EMAIL = process.env.AWS_PB_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.AWS_PB_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD

const pb = new PocketBase(PB_URL)

async function main() {
  console.log(`Connecting to PocketBase at ${PB_URL}`)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('Authenticated as superadmin')

  // 1. user_behavior_profiles
  try {
    await pb.collections.create({
      name: 'user_behavior_profiles',
      type: 'base',
      schema: [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'peak_active_hour', type: 'number', required: true, options: { min: 0, max: 23 } },
        { name: 'peak_active_hour_2', type: 'number', options: { min: 0, max: 23 } },
        { name: 'craving_peak_hour', type: 'number', options: { min: 0, max: 23 } },
        { name: 'avg_session_minutes', type: 'number', required: true, options: { min: 0 } },
        { name: 'preferred_step_types', type: 'json' },
        { name: 'typical_dropout_step', type: 'number', options: { min: 0 } },
        { name: 'dominant_trigger', type: 'select', required: true, options: { values: ['stress', 'boredom', 'social', 'habit', 'other'] } },
        { name: 'avg_craving_intensity', type: 'number', required: true, options: { min: 0, max: 5 } },
        { name: 'intensity_trend', type: 'select', required: true, options: { values: ['rising', 'stable', 'falling'] } },
        { name: 'mood_trend', type: 'select', required: true, options: { values: ['improving', 'stable', 'declining'] } },
        { name: 'assigned_archetype', type: 'select', required: true, options: { values: ['escapist', 'stress_reactor', 'social_mirror', 'auto_pilot'] } },
        { name: 'behavioral_archetype', type: 'select', required: true, options: { values: ['escapist', 'stress_reactor', 'social_mirror', 'auto_pilot'] } },
        { name: 'archetype_confidence', type: 'number', required: true, options: { min: 0, max: 1 } },
        { name: 'best_notification_hour', type: 'number', options: { min: 0, max: 23 } },
        { name: 'best_notification_style', type: 'select', required: true, options: { values: ['motivational', 'grounding', 'factual', 'challenge'] } },
        { name: 'notification_open_rate', type: 'number', required: true, options: { min: 0, max: 1 } },
        { name: 'learning_phase', type: 'select', required: true, options: { values: ['observing', 'active'] } },
        { name: 'days_observed', type: 'number', required: true, options: { min: 0 } },
        { name: 'last_updated', type: 'date', required: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_ubp_user ON user_behavior_profiles (user)',
      ],
    })
    console.log('✓ Created user_behavior_profiles collection')
  } catch (e) {
    if (e.status === 400) console.log('⚠ user_behavior_profiles already exists')
    else throw e
  }

  // 2. notification_events
  try {
    await pb.collections.create({
      name: 'notification_events',
      type: 'base',
      schema: [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'trigger_type', type: 'select', required: true, options: { values: ['scheduled', 'craving_spike', 'missed_session', 'slip'] } },
        { name: 'message_title', type: 'text', required: true, options: { max: 100 } },
        { name: 'message_body', type: 'text', required: true, options: { max: 200 } },
        { name: 'archetype_at_send', type: 'select', required: true, options: { values: ['escapist', 'stress_reactor', 'social_mirror', 'auto_pilot'] } },
        { name: 'day_number', type: 'number', required: true, options: { min: 1, max: 30 } },
        { name: 'sent_at', type: 'date', required: true },
        { name: 'opened_at', type: 'date' },
        { name: 'led_to_session', type: 'bool' },
      ],
      indexes: [
        'CREATE INDEX idx_ne_user ON notification_events (user)',
        'CREATE INDEX idx_ne_trigger ON notification_events (trigger_type)',
      ],
    })
    console.log('✓ Created notification_events collection')
  } catch (e) {
    if (e.status === 400) console.log('⚠ notification_events already exists')
    else throw e
  }

  // 3. personalization_logs
  try {
    await pb.collections.create({
      name: 'personalization_logs',
      type: 'base',
      schema: [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'day_number', type: 'number', required: true, options: { min: 1, max: 30 } },
        { name: 'request_type', type: 'select', required: true, options: { values: ['session_content', 'notification', 'behavior_update'] } },
        { name: 'archetype_used', type: 'select', required: true, options: { values: ['escapist', 'stress_reactor', 'social_mirror', 'auto_pilot'] } },
        { name: 'okf_docs_loaded', type: 'json' },
        { name: 'ai_response_summary', type: 'text', options: { max: 2000 } },
        { name: 'content_fit_score', type: 'number', options: { min: 0, max: 10 } },
      ],
      indexes: [
        'CREATE INDEX idx_pl_user ON personalization_logs (user)',
      ],
    })
    console.log('✓ Created personalization_logs collection')
  } catch (e) {
    if (e.status === 400) console.log('⚠ personalization_logs already exists')
    else throw e
  }

  console.log('\n✅ All OKF behavioral collections ready')
}

main().catch(console.error)
