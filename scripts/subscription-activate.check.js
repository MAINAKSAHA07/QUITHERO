/**
 * ponytail: shared activate module exports — fails if rename breaks Razorpay/IAP imports
 */
import assert from 'assert'
import { activateSubscription, expireSubscription } from './subscription-activate.js'

assert.equal(typeof activateSubscription, 'function')
assert.equal(typeof expireSubscription, 'function')
console.log('subscription-activate.check OK')
