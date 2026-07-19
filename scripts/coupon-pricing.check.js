import {
  normalizeCouponCode,
  applyPercentOffMajor,
  validateCouponRecord,
} from './coupon-pricing.js'

console.assert(normalizeCouponCode('  save20 ') === 'SAVE20')
console.assert(normalizeCouponCode('') === '')

{
  const r = applyPercentOffMajor(1999, 20)
  console.assert(r.ok === true)
  console.assert(r.discounted === 1599)
  console.assert(r.original === 1999)
}

{
  const r = applyPercentOffMajor(100, 100)
  console.assert(r.ok === true)
  // clamped to Razorpay min (₹1)
  console.assert(r.discounted === 1)
  console.assert(r.clamped === true)
}

{
  const r = applyPercentOffMajor(50, 99, 'USD')
  console.assert(r.ok === true)
  console.assert(r.discounted === 1)
  console.assert(r.clamped === true)
}

{
  const r = applyPercentOffMajor(50, 0)
  console.assert(r.ok === false)
}

{
  const r = validateCouponRecord({
    active: true,
    percent_off: 20,
    max_redemptions: 0,
    redeemed_count: 0,
  })
  console.assert(r.ok === true && r.percent_off === 20)
}

{
  const r = validateCouponRecord({ active: false, percent_off: 20 })
  console.assert(r.ok === false)
}

{
  const r = validateCouponRecord({
    active: true,
    percent_off: 20,
    max_redemptions: 5,
    redeemed_count: 5,
  })
  console.assert(r.ok === false)
}

{
  const r = validateCouponRecord({
    active: true,
    percent_off: 20,
    valid_until: '2000-01-01',
  })
  console.assert(r.ok === false)
}

{
  const r = validateCouponRecord({
    active: true,
    percent_off: 20,
    valid_from: '2099-01-01',
  })
  console.assert(r.ok === false)
}

console.log('coupon-pricing.check: ok')
