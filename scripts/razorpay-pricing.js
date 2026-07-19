/**
 * Server-side subscription prices (major units). Keep in sync with frontend/utils/currency.ts.
 * Amount sent to Razorpay is computed here — never trust client-supplied amount.
 */
export const SUBSCRIPTION_PRICES = {
  IN: { currency: 'INR', amount: 1999 },
  US: { currency: 'USD', amount: 50 },
  GB: { currency: 'GBP', amount: 40 },
  CA: { currency: 'CAD', amount: 65 },
  AU: { currency: 'AUD', amount: 75 },
  DE: { currency: 'EUR', amount: 45 },
  FR: { currency: 'EUR', amount: 45 },
  JP: { currency: 'JPY', amount: 7500 },
  BR: { currency: 'BRL', amount: 250 },
  ZA: { currency: 'ZAR', amount: 899 },
  AE: { currency: 'AED', amount: 185 },
  SA: { currency: 'SAR', amount: 185 },
  SG: { currency: 'SGD', amount: 65 },
  MY: { currency: 'MYR', amount: 220 },
  PH: { currency: 'PHP', amount: 2799 },
  ID: { currency: 'IDR', amount: 799000 },
  NG: { currency: 'NGN', amount: 29999 },
  KE: { currency: 'KES', amount: 6499 },
  PK: { currency: 'PKR', amount: 13999 },
  BD: { currency: 'BDT', amount: 5499 },
  MX: { currency: 'MXN', amount: 899 },
  RU: { currency: 'RUB', amount: 4499 },
  KR: { currency: 'KRW', amount: 65000 },
  IT: { currency: 'EUR', amount: 45 },
  ES: { currency: 'EUR', amount: 45 },
  NL: { currency: 'EUR', amount: 45 },
  SE: { currency: 'SEK', amount: 529 },
  NZ: { currency: 'NZD', amount: 80 },
  TH: { currency: 'THB', amount: 1799 },
  VN: { currency: 'VND', amount: 1199000 },
}

/** Razorpay zero-decimal currencies — amount is already smallest unit. */
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

export function isZeroDecimalCurrency(currency) {
  return ZERO_DECIMAL.has(String(currency || '').toUpperCase())
}

/** Razorpay min charge is 100 smallest units → major units for display/pricing. */
export function minChargeableMajor(currency) {
  return isZeroDecimalCurrency(currency) ? 100 : 1
}

export function resolvePlan(countryCode = 'IN') {
  return SUBSCRIPTION_PRICES[countryCode] || SUBSCRIPTION_PRICES.IN
}

/** Convert major-unit price → Razorpay amount (paise / cents / etc.). */
export function toRazorpayAmount(major, currency) {
  const n = Number(major)
  if (!Number.isFinite(n) || n <= 0) return 0
  if (isZeroDecimalCurrency(currency)) return Math.round(n)
  return Math.round(n * 100)
}
