import { analyticsPageFromPath } from './analyticsPage'

console.assert(analyticsPageFromPath('/home') === 'home')
console.assert(analyticsPageFromPath('/sessions/') === 'sessions')
console.assert(analyticsPageFromPath('/sessions/abc123') === 'session')
console.assert(analyticsPageFromPath('/session/3') === 'session')
console.assert(analyticsPageFromPath('/objection/price') === 'objection')
console.assert(analyticsPageFromPath('/coach') === 'coach')
console.assert(analyticsPageFromPath('/paywall') === 'paywall')
console.assert(analyticsPageFromPath('/claim-gift') === 'claim_gift')
console.assert(analyticsPageFromPath('/') === 'root')
console.log('analyticsPage.check.ts: ok')
