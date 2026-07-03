/**
 * Add RAG-ready fields to program content collections and create content_chunks.
 *
 * Run once on existing PocketBase:
 *   node PocketBase/migrate-content-rag.js
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.id != "" && @collection.admin_users.id ?= @request.auth.id'

const CONTENT_ROLE_VALUES = ['intro', 'lesson', 'exercise', 'tool', 'reflection', 'preview', 'metadata']
const EMBEDDING_STATUS_VALUES = ['pending', 'indexed', 'failed', 'stale']

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
    base.collectionId = f.collectionId || f.collection
    base.maxSelect = f.maxSelect ?? 1
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
  if (f.type === 'bool') {
    base.defaultValue = f.defaultValue ?? false
  }
  return base
}

async function resolveCollectionId(nameOrId) {
  if (!nameOrId || nameOrId.startsWith('_') || nameOrId.length > 20) return nameOrId
  const col = await pb.collections.getFirstListItem(`name="${nameOrId}"`)
  return col.id
}

function mergeFields(existingFields, extraDefs) {
  const idField = existingFields.find((f) => f.primaryKey) || existingFields.find((f) => f.name === 'id')
  const merged = idField ? [idField] : []
  const names = new Set()

  for (const f of existingFields) {
    if (f.primaryKey || f.name === 'id') continue
    merged.push(f)
    if (!f.system) names.add(f.name)
  }

  for (const def of extraDefs) {
    if (names.has(def.name)) {
      const idx = merged.findIndex((f) => f.name === def.name)
      merged[idx] = { ...merged[idx], ...toField(def) }
    } else {
      merged.push(toField(def))
    }
  }
  return merged
}

async function patchCollection(name, extraFields = []) {
  let col
  try {
    col = await pb.collections.getOne(name)
  } catch {
    console.log(`  ⚠ Collection "${name}" not found — skipping`)
    return
  }

  const fields = mergeFields(col.fields || col.schema || [], extraFields)
  await pb.collections.update(col.id, { fields })
  console.log(`  ✓ Updated "${name}" (+${extraFields.length} fields)`)
}

async function ensureContentChunksCollection() {
  const programId = await resolveCollectionId('programs')
  const programDayId = await resolveCollectionId('program_days')
  const stepId = await resolveCollectionId('steps')

  const userFields = [
    toField({ name: 'program', type: 'relation', collectionId: programId, maxSelect: 1, cascadeDelete: true }),
    toField({ name: 'program_day', type: 'relation', collectionId: programDayId, maxSelect: 1, cascadeDelete: true }),
    toField({ name: 'step', type: 'relation', collectionId: stepId, maxSelect: 1, cascadeDelete: true }),
    toField({ name: 'slug', type: 'text', required: true }),
    toField({ name: 'module_key', type: 'text', required: true }),
    toField({ name: 'chunk_index', type: 'number' }),
    toField({ name: 'title', type: 'text', required: true }),
    toField({ name: 'body', type: 'text', required: true }),
    toField({ name: 'content_role', type: 'select', values: CONTENT_ROLE_VALUES }),
    toField({ name: 'cbt_technique', type: 'text' }),
    toField({ name: 'tags', type: 'json' }),
    toField({ name: 'language', type: 'select', values: ['en', 'es', 'fr', 'hi', 'de', 'zh'] }),
    toField({ name: 'day_number', type: 'number' }),
    toField({ name: 'embedding_status', type: 'select', values: EMBEDDING_STATUS_VALUES }),
    toField({ name: 'vector_ref', type: 'text' }),
    toField({ name: 'token_estimate', type: 'number' }),
    toField({ name: 'is_active', type: 'bool', defaultValue: true }),
  ]

  let col
  try {
    col = await pb.collections.getOne('content_chunks')
    const fields = mergeFields(col.fields || [], userFields)
    await pb.collections.update(col.id, {
      fields,
      listRule: '',
      viewRule: '',
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    })
    console.log('  ✓ Updated content_chunks schema')
    return
  } catch {
    /* create below */
  }

  const idField = {
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
    pattern: '^[a-z0-9]+$',
  }

  await pb.collections.create({
    name: 'content_chunks',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: adminRule,
    updateRule: adminRule,
    deleteRule: adminRule,
    fields: [idField, ...userFields],
  })
  console.log('  ✓ Created content_chunks collection')
}

async function run() {
  console.log(`\n🔧 RAG content schema migration → ${PB_URL}\n`)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  await patchCollection('programs', [
    { name: 'slug', type: 'text' },
    { name: 'method_name', type: 'text' },
  ])

  await patchCollection('program_days', [
    { name: 'slug', type: 'text' },
    { name: 'cbt_technique', type: 'text' },
    { name: 'day_theme', type: 'text' },
  ])

  await patchCollection('steps', [
    { name: 'slug', type: 'text' },
    { name: 'module_key', type: 'text' },
    { name: 'step_title', type: 'text' },
    { name: 'plain_text', type: 'text' },
    { name: 'content_role', type: 'select', values: CONTENT_ROLE_VALUES },
    { name: 'cbt_technique', type: 'text' },
  ])

  await ensureContentChunksCollection()

  console.log('\n✅ Migration complete.\n')
  console.log('Next: node PocketBase/seed-program-day.js day-01-seeing-the-trap\n')
}

run().catch((err) => {
  console.error('❌', err.message)
  if (err.response) console.error(JSON.stringify(err.response, null, 2))
  process.exit(1)
})
