import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/sw.js')
const sw = readFileSync(root, 'utf8')

assert.match(sw, /smono-v5/, 'cache name bumped so old shells clear')
assert.match(sw, /isNavigate/, 'navigations handled specially')
assert.doesNotMatch(
  sw,
  /isNavigate[\s\S]{0,200}caches\.open\(CACHE\)\.then\(\(c\) => c\.put/,
  'must not cache HTML navigation responses'
)
assert.match(sw, /pathname\.startsWith\('\/assets\/'\)/, 'only hashed assets are cached')
console.log('sw-cache-policy.check ok')
