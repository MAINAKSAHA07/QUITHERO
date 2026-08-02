/**
 * Runnable check: backoffice Messages API must hit app host in prod.
 * Run: npx tsx backoffice/src/lib/sendPush.check.ts
 */
import assert from 'node:assert/strict'

function appApiBase(env: {
  VITE_PUSH_API_ORIGIN?: string
  VITE_APP_API_ORIGIN?: string
  PROD?: boolean
}): string {
  const fromEnv = (env.VITE_PUSH_API_ORIGIN || env.VITE_APP_API_ORIGIN || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (env.PROD) return 'https://app.smono.app'
  return ''
}

function supportUrl(base: string, path: string): string {
  return base ? `${base}${path}` : path
}

assert.equal(appApiBase({ PROD: true }), 'https://app.smono.app')
assert.equal(appApiBase({ PROD: false }), '')
assert.equal(
  supportUrl(appApiBase({ PROD: true }), '/api/support/admin-message'),
  'https://app.smono.app/api/support/admin-message'
)
assert.equal(supportUrl('', '/api/support/admin-message'), '/api/support/admin-message')

console.log('sendPush.check: ok')
