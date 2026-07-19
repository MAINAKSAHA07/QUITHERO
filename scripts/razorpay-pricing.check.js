import { resolvePlan, toRazorpayAmount } from './razorpay-pricing.js'

console.assert(resolvePlan('IN').currency === 'INR')
console.assert(toRazorpayAmount(1999, 'INR') === 199900)
console.assert(toRazorpayAmount(1999, 'INR') >= 100)
console.assert(toRazorpayAmount(7500, 'JPY') === 7500)
console.assert(resolvePlan('XX').currency === 'INR')
console.log('razorpay-pricing.check: ok')
