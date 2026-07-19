/**
 * ponytail: deep link path extract — claim-payment must resolve
 */
import assert from 'assert'
import { pathFromAppUrl } from './deepLinks.ts'

assert.equal(
  pathFromAppUrl('https://app.smono.app/claim-payment?razorpay_order_id=1'),
  '/claim-payment?razorpay_order_id=1'
)
assert.equal(pathFromAppUrl('https://app.smono.app/home'), '/home')
assert.equal(pathFromAppUrl('smono://claim-payment?token=abc'), '/claim-payment?token=abc')
assert.equal(pathFromAppUrl('not-a-url'), null)
console.log('deepLinks.check OK')
