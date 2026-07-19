/**
 * Runnable check: npx tsx frontend/utils/phone.check.ts
 */
import {
  dialForCountry,
  splitPhone,
  joinPhone,
  isValidE164Phone,
  DEFAULT_DIAL,
} from './phone'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(dialForCountry('IN') === '+91', 'IN dial')
assert(dialForCountry('US') === '+1', 'US dial')
assert(dialForCountry(undefined) === DEFAULT_DIAL, 'default dial')

const split = splitPhone('+919876543210')
assert(split.dial === '+91' && split.local === '9876543210', 'split IN')

const joined = joinPhone('+91', '9876543210')
assert(joined === '+919876543210', 'join')
assert(isValidE164Phone(joined), 'valid e164')
assert(!isValidE164Phone('123'), 'too short invalid')

console.log('phone.check: ok')
