import { buildSelfUserPatch, emailChangeRequested } from './selfUserPatch'

console.assert(buildSelfUserPatch('  Ada  ').name === 'Ada')
console.assert(!('email' in buildSelfUserPatch('Ada')))

console.assert(emailChangeRequested('a@b.com', 'a@b.com') === null)
console.assert(emailChangeRequested('a@b.com', '  a@b.com  ') === null)
console.assert(emailChangeRequested('a@b.com', 'c@d.com') === 'c@d.com')
console.assert(emailChangeRequested('a@b.com', '  ') === null)

console.log('selfUserPatch.check: ok')
