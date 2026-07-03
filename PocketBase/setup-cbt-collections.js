import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()

async function setup() {
  const pb = new PocketBase(PB_URL)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('Authenticated as admin')

  // belief_assessments
  try {
    await pb.collections.create({
      name: 'belief_assessments',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'assessment_day', type: 'number', required: true },
        { name: 'belief_relaxation', type: 'number', required: true },
        { name: 'belief_enjoyment', type: 'number', required: true },
        { name: 'belief_concentration', type: 'number', required: true },
        { name: 'belief_social', type: 'number', required: true },
        { name: 'belief_stress_relief', type: 'number', required: true },
        { name: 'total_score', type: 'number', required: true },
      ],
      listRule: '@request.auth.id = user',
      viewRule: '@request.auth.id = user',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
    })
    console.log('Created belief_assessments collection')
  } catch (e) { console.log('belief_assessments:', e.message || 'already exists') }

  // technique_outcomes
  try {
    await pb.collections.create({
      name: 'technique_outcomes',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'day_number', type: 'number', required: true },
        { name: 'cbt_technique', type: 'text', required: true },
        { name: 'archetype', type: 'text' },
        { name: 'cravings_before', type: 'number' },
        { name: 'avg_intensity_before', type: 'number' },
        { name: 'dominant_trigger_before', type: 'text' },
        { name: 'cravings_after', type: 'number' },
        { name: 'avg_intensity_after', type: 'number' },
        { name: 'intensity_delta', type: 'number' },
        { name: 'frequency_delta', type: 'number' },
        { name: 'technique_worked', type: 'bool' },
      ],
      listRule: '@request.auth.id = user',
      viewRule: '@request.auth.id = user',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
    })
    console.log('Created technique_outcomes collection')
  } catch (e) { console.log('technique_outcomes:', e.message || 'already exists') }

  // Extend existing cravings collection with CBT fields
  try {
    const cols = await pb.collections.getFullList()
    const cravings = cols.find(c => c.name === 'cravings')
    if (cravings) {
      const existingFields = (cravings.fields || []).map(f => f.name)
      const newFields = []
      if (!existingFields.includes('automatic_thought')) {
        newFields.push({ name: 'automatic_thought', type: 'text' })
      }
      if (!existingFields.includes('resolution_method')) {
        newFields.push({ name: 'resolution_method', type: 'text' })
      }
      if (!existingFields.includes('resolution_time_minutes')) {
        newFields.push({ name: 'resolution_time_minutes', type: 'number' })
      }
      if (!existingFields.includes('ai_analysis')) {
        newFields.push({ name: 'ai_analysis', type: 'json' })
      }
      if (newFields.length > 0) {
        await pb.collections.update(cravings.id, {
          fields: [...cravings.fields, ...newFields],
        })
        console.log(`Extended cravings with ${newFields.length} new CBT fields`)
      } else {
        console.log('cravings: CBT fields already exist')
      }
    }
  } catch (e) { console.log('cravings extend:', e.message) }

  // Extend journal_entries with CBT fields
  try {
    const cols = await pb.collections.getFullList()
    const journal = cols.find(c => c.name === 'journal_entries')
    if (journal) {
      const existingFields = (journal.fields || []).map(f => f.name)
      const newFields = []
      if (!existingFields.includes('cbt_mode')) {
        newFields.push({ name: 'cbt_mode', type: 'bool' })
      }
      if (!existingFields.includes('antecedent')) {
        newFields.push({ name: 'antecedent', type: 'text' })
      }
      if (!existingFields.includes('automatic_thought')) {
        newFields.push({ name: 'automatic_thought', type: 'text' })
      }
      if (!existingFields.includes('behavioral_response')) {
        newFields.push({ name: 'behavioral_response', type: 'text' })
      }
      if (newFields.length > 0) {
        await pb.collections.update(journal.id, {
          fields: [...journal.fields, ...newFields],
        })
        console.log(`Extended journal_entries with ${newFields.length} new CBT fields`)
      } else {
        console.log('journal_entries: CBT fields already exist')
      }
    }
  } catch (e) { console.log('journal_entries extend:', e.message) }

  // Extend step_responses with ai_analysis field
  try {
    const cols = await pb.collections.getFullList()
    const steps = cols.find(c => c.name === 'step_responses')
    if (steps) {
      const existingFields = (steps.fields || []).map(f => f.name)
      if (!existingFields.includes('ai_analysis')) {
        await pb.collections.update(steps.id, {
          fields: [...steps.fields, { name: 'ai_analysis', type: 'json' }],
        })
        console.log('Extended step_responses with ai_analysis field')
      } else {
        console.log('step_responses: ai_analysis already exists')
      }
    }
  } catch (e) { console.log('step_responses extend:', e.message) }

  console.log('\nCBT collections setup complete!')
}

setup().catch(console.error)
