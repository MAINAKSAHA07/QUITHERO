/**
 * Import all Smono program Word docs → content/days/*.js and optionally seed PocketBase.
 *
 * Usage:
 *   node PocketBase/import-program-docs.js "/path/to/Smono_30_Day_Program_Word_Docs"
 *   node PocketBase/import-program-docs.js "/path/to/docs" --seed
 *   node PocketBase/import-program-docs.js "/path/to/docs" --seed --from 2 --to 30
 *   node PocketBase/import-program-docs.js "/path/to/docs" --seed-all
 */

import { readdirSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseDayDocx, renderDayModule } from './content/parse-docx-day.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DAYS_DIR = join(__dirname, 'content', 'days')

const args = process.argv.slice(2)
const docsDir = args.find((a) => !a.startsWith('--'))
const shouldSeed = args.includes('--seed') || args.includes('--seed-all')
const seedAll = args.includes('--seed-all')
const fromDay = parseInt(args[args.indexOf('--from') + 1] || '2', 10)
const toDay = parseInt(args[args.indexOf('--to') + 1] || '30', 10)
const skipExisting = args.includes('--skip-existing')

if (!docsDir) {
  console.error('Usage: node PocketBase/import-program-docs.js <docs-folder> [--seed] [--from 2] [--to 30]')
  process.exit(1)
}

mkdirSync(DAYS_DIR, { recursive: true })

const files = readdirSync(docsDir)
  .filter((f) => /^Day_\d+_.+\.docx$/i.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/Day_(\d+)/)[1], 10)
    const nb = parseInt(b.match(/Day_(\d+)/)[1], 10)
    return na - nb
  })

const slugs = []

for (const file of files) {
  const dayNum = parseInt(file.match(/Day_(\d+)/)[1], 10)
  if (dayNum === 0) {
    console.log(`  ⊘ Skip Day 0 (overview): ${file}`)
    continue
  }
  if (dayNum === 1) {
    console.log(`  ⊘ Skip Day 1 (already seeded): ${file}`)
    continue
  }
  if (dayNum < fromDay || dayNum > toDay) continue

  const docxPath = join(docsDir, file)
  try {
    const parsed = parseDayDocx(docxPath)
    const outPath = join(DAYS_DIR, `${parsed.dayMeta.slug}.js`)
    if (skipExisting && slugs.includes(parsed.dayMeta.slug)) continue

    writeFileSync(outPath, renderDayModule(parsed))
    slugs.push(parsed.dayMeta.slug)
    console.log(`  ✓ Day ${dayNum}: ${parsed.steps.length} steps → ${parsed.dayMeta.slug}.js`)
  } catch (err) {
    console.error(`  ✗ Day ${dayNum} (${file}): ${err.message}`)
  }
}

console.log(`\nGenerated ${slugs.length} day modules in PocketBase/content/days/\n`)

if (shouldSeed) {
  const { spawnSync } = await import('child_process')
  if (seedAll) {
    console.log('Seeding all program days from content/days/*.js…\n')
    const r = spawnSync('node', [join(__dirname, 'seed-all-program-days.js')], {
      stdio: 'inherit',
      cwd: __dirname,
    })
    if (r.status !== 0) process.exit(1)
  } else if (slugs.length) {
    console.log('Seeding PocketBase…\n')
    for (const slug of slugs) {
      const r = spawnSync('node', [join(__dirname, 'seed-program-day.js'), slug], {
        stdio: 'inherit',
        cwd: __dirname,
      })
      if (r.status !== 0) {
        console.error(`Failed seeding ${slug}`)
        process.exit(1)
      }
    }
    console.log(`\n✅ Seeded ${slugs.length} days.\n`)
  }
}
