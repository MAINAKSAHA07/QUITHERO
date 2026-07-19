import {
  getLoginLockout,
  recordLoginFailure,
  recordLoginSuccess,
  formatLockoutDuration,
  isReturningLoginUser,
  markReturningLoginUser,
} from './loginRateLimit'

// ponytail: minimal in-memory localStorage for node self-check
const mem: Record<string, string> = {}
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem[k] ?? null,
  setItem: (k: string, v: string) => { mem[k] = v },
  removeItem: (k: string) => { delete mem[k] },
}

const email = 'bot@test.com'
recordLoginFailure(email)
recordLoginFailure(email)
recordLoginFailure(email)
let state = getLoginLockout(email)
console.assert(state.failures === 3 && state.attemptsRemaining === 2, 'tracks failures')

for (let i = 0; i < 2; i++) recordLoginFailure(email)
state = getLoginLockout(email)
console.assert(state.locked && state.attemptsRemaining === 0, 'locks after max attempts')

recordLoginSuccess(email)
state = getLoginLockout(email)
console.assert(!state.locked && state.failures === 0, 'clears on success')

console.assert(formatLockoutDuration(90_000).includes('min'), 'formats lockout')

console.assert(!isReturningLoginUser(), 'new device is not returning')
markReturningLoginUser()
console.assert(isReturningLoginUser(), 'marks returning after login')

console.log('loginRateLimit.check: ok')
