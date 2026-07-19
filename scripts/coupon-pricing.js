/**
 * Pure coupon math + validation (percent off only).
 * Lookup / redeem live in razorpay-api.js (needs PocketBase admin).
 */
import { minChargeableMajor } from './razorpay-pricing.js'

export function normalizeCouponCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
}

/**
 * Floor major-unit price after percent off.
 * Clamps to Razorpay minimum charge when % would otherwise floor to $0 / ¥0.
 * @param {number} majorAmount
 * @param {number} percentOff
 * @param {string} [currency='INR']
 */
export function applyPercentOffMajor(majorAmount, percentOff, currency = 'INR') {
  const a = Number(majorAmount)
  const p = Number(percentOff)
  if (!Number.isFinite(a) || a <= 0) {
    return { ok: false, error: 'Invalid amount' }
  }
  if (!Number.isFinite(p) || p < 1 || p > 100) {
    return { ok: false, error: 'Percent must be 1–100' }
  }
  const raw = Math.floor((a * (100 - p)) / 100)
  const min = minChargeableMajor(currency)
  // ponytail: Razorpay rejects <100 smallest units; clamp so 99% of $50 → $1 not $0
  const discounted = Math.min(a, Math.max(raw, min))
  return {
    ok: true,
    original: a,
    discounted,
    percent_off: p,
    clamped: discounted !== raw,
  }
}

/**
 * Validate a coupons collection record (already loaded).
 * @returns {{ ok: true, percent_off: number } | { ok: false, error: string }}
 */
export function validateCouponRecord(coupon, now = new Date()) {
  if (!coupon || typeof coupon !== 'object') {
    return { ok: false, error: 'Invalid coupon' }
  }
  if (coupon.active === false) {
    return { ok: false, error: 'Coupon inactive' }
  }
  const p = Number(coupon.percent_off)
  if (!Number.isFinite(p) || p < 1 || p > 100) {
    return { ok: false, error: 'Invalid coupon' }
  }
  const max = Number(coupon.max_redemptions) || 0
  const used = Number(coupon.redeemed_count) || 0
  if (max > 0 && used >= max) {
    return { ok: false, error: 'Coupon fully redeemed' }
  }
  if (coupon.valid_from) {
    const from = new Date(coupon.valid_from)
    if (!Number.isNaN(from.getTime()) && now < from) {
      return { ok: false, error: 'Coupon not yet valid' }
    }
  }
  if (coupon.valid_until) {
    const until = new Date(coupon.valid_until)
    if (!Number.isNaN(until.getTime()) && now > until) {
      return { ok: false, error: 'Coupon expired' }
    }
  }
  return { ok: true, percent_off: p }
}
