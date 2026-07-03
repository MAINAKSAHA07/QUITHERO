/**
 * Seed a program day from PocketBase/content/days/*.js
 *
 * Usage:
 *   node PocketBase/seed-program-day.js day-01-seeing-the-trap
 *
 * Creates/updates program, program_day, steps, and content_chunks (RAG corpus).
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'
import { stepPlainText, buildChunkRecords } from './content/rag-utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const PROGRAM = {
  slug: 'smono-reset-method',
  method_name: 'Smono Reset Method',
  title: 'Smono Reset Method',
  description: '30-day CBT-based nicotine reset — remove the wanting before removing the cigarette.',
  language: 'en',
  duration_days: 30,
  is_active: true,
  order: 1,
}

async function loadDayModule(slug) {
  const path = `./content/days/${slug}.js`
  return import(path)
}

async function upsertProgram() {
  try {
    const existing = await pb.collection('programs').getFirstListItem(
      `slug = "${PROGRAM.slug}" || (language = "en" && is_active = true)`
    )
    return pb.collection('programs').update(existing.id, PROGRAM)
  } catch {
    return pb.collection('programs').create(PROGRAM)
  }
}

async function upsertProgramDay(programId, dayMeta) {
  const payload = {
    program: programId,
    day_number: dayMeta.day_number,
    title: dayMeta.title,
    subtitle: dayMeta.subtitle,
    day_theme: dayMeta.day_theme,
    cbt_technique: dayMeta.cbt_technique,
    slug: dayMeta.slug,
    estimated_duration_min: dayMeta.estimated_duration_min,
    is_locked: dayMeta.day_number > 1,
  }

  try {
    const existing = await pb.collection('program_days').getFirstListItem(
      `program = "${programId}" && day_number = ${dayMeta.day_number}`
    )
    return pb.collection('program_days').update(existing.id, payload)
  } catch {
    return pb.collection('program_days').create(payload)
  }
}

async function replaceSteps(programDayId, dayMeta, stepDefs) {
  const existing = await pb.collection('steps').getFullList({
    filter: `program_day = "${programDayId}"`,
    sort: 'order',
  })

  const kept = new Set()
  const stepRecords = []

  for (const def of stepDefs) {
    const plain_text = stepPlainText(def)
    const payload = {
      program_day: programDayId,
      order: def.order,
      type: def.type,
      content_json: def.content_json,
      slug: def.slug,
      module_key: def.module_key,
      step_title: def.step_title,
      plain_text,
      content_role: def.content_role,
      cbt_technique: dayMeta.cbt_technique,
    }

    const match = existing.find((s) => s.slug === def.slug || s.order === def.order)
    let record
    if (match) {
      record = await pb.collection('steps').update(match.id, payload)
    } else {
      record = await pb.collection('steps').create(payload)
    }
    kept.add(record.id)
    stepRecords.push({ record, def })
  }

  for (const old of existing) {
    if (!kept.has(old.id)) {
      await pb.collection('steps').delete(old.id)
    }
  }

  return stepRecords
}

async function replaceChunks(programId, programDayId, dayMeta, stepRecords) {
  let hasChunks = true
  try {
    await pb.collections.getOne('content_chunks')
  } catch {
    hasChunks = false
    console.log('  ⚠ content_chunks missing — run migrate-content-rag.js first (skipping chunks)')
  }
  if (!hasChunks) return 0

  const oldChunks = await pb.collection('content_chunks').getFullList()
  for (const c of oldChunks) {
    if (c.program_day === programDayId || c.module_key?.startsWith(`day${String(dayMeta.day_number).padStart(2, '0')}`)) {
      await pb.collection('content_chunks').delete(c.id)
    }
  }

  let count = 0
  for (const { record, def } of stepRecords) {
    const rows = buildChunkRecords({
      programId,
      programDayId,
      stepRecord: record,
      stepDef: def,
      dayMeta,
      language: PROGRAM.language,
    })
    for (const row of rows) {
      await pb.collection('content_chunks').create(row)
      count++
    }
  }
  return count
}

async function run() {
  const daySlug = process.argv[2]
  if (!daySlug) {
    console.error('Usage: node PocketBase/seed-program-day.js <day-file-slug>')
    console.error('Example: node PocketBase/seed-program-day.js day-01-seeing-the-trap')
    process.exit(1)
  }

  console.log(`\n📚 Seeding program day → ${daySlug}\n`)
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)

  const mod = await loadDayModule(daySlug)
  const { dayMeta, steps: stepDefs } = mod
  if (!dayMeta || !stepDefs?.length) {
    throw new Error(`Invalid day module: ${daySlug}`)
  }

  const program = await upsertProgram()
  console.log(`  ✓ Program: ${program.title} (${program.id})`)

  const programDay = await upsertProgramDay(program.id, dayMeta)
  console.log(`  ✓ Day ${dayMeta.day_number}: ${dayMeta.title}`)

  const stepRecords = await replaceSteps(programDay.id, dayMeta, stepDefs)
  console.log(`  ✓ Steps: ${stepRecords.length}`)

  const chunkCount = await replaceChunks(program.id, programDay.id, dayMeta, stepRecords)
  console.log(`  ✓ RAG chunks: ${chunkCount}`)

  console.log('\n✅ Done.\n')
}

run().catch((err) => {
  console.error('❌', err.message)
  if (err.response) console.error(JSON.stringify(err.response, null, 2))
  process.exit(1)
})
