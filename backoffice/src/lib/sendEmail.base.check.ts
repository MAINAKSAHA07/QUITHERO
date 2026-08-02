/**
 * Prefer same-origin email API from admin (relative /api/email).
 * Env override still wins when set.
 */
function appApiBase(env: {
  VITE_PUSH_API_ORIGIN?: string
  VITE_APP_API_ORIGIN?: string
}): string {
  const fromEnv = (env.VITE_PUSH_API_ORIGIN || env.VITE_APP_API_ORIGIN || '').replace(
    /\/$/,
    ''
  )
  if (fromEnv) return fromEnv
  return ''
}

console.assert(appApiBase({}) === '')
console.assert(appApiBase({ VITE_PUSH_API_ORIGIN: 'https://app.smono.app/' }) === 'https://app.smono.app')
console.assert(appApiBase({ VITE_APP_API_ORIGIN: 'https://x.test' }) === 'https://x.test')
console.log('sendEmail.base.check: ok')
