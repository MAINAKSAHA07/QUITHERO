/**
 * ponytail: deep link path extract — claim-payment must resolve
 */
import assert from 'assert'
import { pathFromAppUrl, pathFromNotificationUrl } from './deepLinks.ts'

assert.equal(
  pathFromAppUrl('https://app.smono.app/claim-payment?razorpay_order_id=1'),
  '/claim-payment?razorpay_order_id=1'
)
assert.equal(pathFromAppUrl('https://app.smono.app/home'), '/home')
assert.equal(pathFromAppUrl('smono://claim-payment?token=abc'), '/claim-payment?token=abc')
assert.equal(pathFromAppUrl('not-a-url'), null)
assert.equal(pathFromNotificationUrl('/home'), '/home')
assert.equal(pathFromNotificationUrl('/profile?support=abc'), '/profile?support=abc')
assert.equal(pathFromNotificationUrl('https://app.smono.app/home'), '/home')
console.log('deepLinks.check OK')
