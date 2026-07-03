/**
 * Seed all 30 program days from PocketBase/content/days/*.js
 *
 * Usage:
 *   node PocketBase/seed-all-program-days.js
 *   node PocketBase/seed-all-program-days.js --from 1 --to 30
 */

import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DAYS_DIR = join(__dirname, 'content', 'days')

const args = process.argv.slice(2)
const fromDay = parseInt(args[args.indexOf('--from') + 1] || '1', 10)
const toDay = parseInt(args[args.indexOf('--to') + 1] || '30', 10)

const slugs = readdirSync(DAYS_DIR)
  .filter((f) => /^day-\d{2}-.+\.js$/.test(f))
  .map((f) => f.replace(/\.js$/, ''))
  .filter((slug) => {
    const n = parseInt(slug.match(/^day-(\d+)/)[1], 10)
    return n >= fromDay && n <= toDay
  })
  .sort((a, b) => {
    const na = parseInt(a.match(/^day-(\d+)/)[1], 10)
    const nb = parseInt(b.match(/^day-(\d+)/)[1], 10)
    return na - nb
  })

if (!slugs.length) {
  console.error('No day modules found in PocketBase/content/days/')
  process.exit(1)
}

console.log(`\n📚 Seeding ${slugs.length} program days (${fromDay}–${toDay})…\n`)

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
