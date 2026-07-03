/**
 * Seed the full Smono Reset Method (30 days) from PocketBase/content/days/*.js
 *
 * Replaces the old inline 10-day placeholder content.
 * Usage: npm run pb:seed-program
 */

import { spawnSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('Seeding Smono Reset Method (30 days) from content/days/*.js…\n')

const r = spawnSync('node', [join(__dirname, 'seed-all-program-days.js')], {
  stdio: 'inherit',
  cwd: __dirname,
})

process.exit(r.status ?? 1)
