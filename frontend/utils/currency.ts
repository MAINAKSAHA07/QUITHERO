export interface CountryConfig {
  name: string
  currency: string
  symbol: string
  pricePerCigarette: number
  nicotinePerCigarette: number
  subscriptionPrice: number
  subscriptionOriginal: number
}

export const COUNTRIES: Record<string, CountryConfig> = {
  IN: { name: 'India',          currency: 'INR', symbol: '₹',   pricePerCigarette: 12,   nicotinePerCigarette: 0.8, subscriptionPrice: 1999,    subscriptionOriginal: 3999 },
  US: { name: 'United States',  currency: 'USD', symbol: '$',   pricePerCigarette: 0.50, nicotinePerCigarette: 0.8, subscriptionPrice: 50,      subscriptionOriginal: 99 },
  GB: { name: 'United Kingdom', currency: 'GBP', symbol: '£',   pricePerCigarette: 0.85, nicotinePerCigarette: 0.8, subscriptionPrice: 40,      subscriptionOriginal: 79 },
  CA: { name: 'Canada',         currency: 'CAD', symbol: 'C$',  pricePerCigarette: 1.00, nicotinePerCigarette: 0.8, subscriptionPrice: 65,      subscriptionOriginal: 129 },
  AU: { name: 'Australia',      currency: 'AUD', symbol: 'A$',  pricePerCigarette: 2.25, nicotinePerCigarette: 0.8, subscriptionPrice: 75,      subscriptionOriginal: 149 },
  DE: { name: 'Germany',        currency: 'EUR', symbol: '€',   pricePerCigarette: 0.37, nicotinePerCigarette: 0.8, subscriptionPrice: 45,      subscriptionOriginal: 89 },
  FR: { name: 'France',         currency: 'EUR', symbol: '€',   pricePerCigarette: 0.71, nicotinePerCigarette: 0.8, subscriptionPrice: 45,      subscriptionOriginal: 89 },
  JP: { name: 'Japan',          currency: 'JPY', symbol: '¥',   pricePerCigarette: 30,   nicotinePerCigarette: 0.8, subscriptionPrice: 7500,    subscriptionOriginal: 14900 },
  BR: { name: 'Brazil',         currency: 'BRL', symbol: 'R$',  pricePerCigarette: 0.50, nicotinePerCigarette: 0.8, subscriptionPrice: 250,     subscriptionOriginal: 499 },
  ZA: { name: 'South Africa',   currency: 'ZAR', symbol: 'R',   pricePerCigarette: 3.50, nicotinePerCigarette: 0.8, subscriptionPrice: 899,     subscriptionOriginal: 1799 },
  AE: { name: 'UAE',            currency: 'AED', symbol: 'د.إ', pricePerCigarette: 1.00, nicotinePerCigarette: 0.8, subscriptionPrice: 185,     subscriptionOriginal: 369 },
  SA: { name: 'Saudi Arabia',   currency: 'SAR', symbol: '﷼',   pricePerCigarette: 1.00, nicotinePerCigarette: 0.8, subscriptionPrice: 185,     subscriptionOriginal: 369 },
  SG: { name: 'Singapore',      currency: 'SGD', symbol: 'S$',  pricePerCigarette: 0.70, nicotinePerCigarette: 0.8, subscriptionPrice: 65,      subscriptionOriginal: 129 },
  MY: { name: 'Malaysia',       currency: 'MYR', symbol: 'RM',  pricePerCigarette: 0.90, nicotinePerCigarette: 0.8, subscriptionPrice: 220,     subscriptionOriginal: 439 },
  PH: { name: 'Philippines',    currency: 'PHP', symbol: '₱',   pricePerCigarette: 7.50, nicotinePerCigarette: 0.8, subscriptionPrice: 2799,    subscriptionOriginal: 5599 },
  ID: { name: 'Indonesia',      currency: 'IDR', symbol: 'Rp',  pricePerCigarette: 1500, nicotinePerCigarette: 0.8, subscriptionPrice: 799000,  subscriptionOriginal: 1499000 },
  NG: { name: 'Nigeria',        currency: 'NGN', symbol: '₦',   pricePerCigarette: 100,  nicotinePerCigarette: 0.8, subscriptionPrice: 29999,   subscriptionOriginal: 59999 },
  KE: { name: 'Kenya',          currency: 'KES', symbol: 'KSh', pricePerCigarette: 20,   nicotinePerCigarette: 0.8, subscriptionPrice: 6499,    subscriptionOriginal: 12999 },
  PK: { name: 'Pakistan',       currency: 'PKR', symbol: '₨',   pricePerCigarette: 15,   nicotinePerCigarette: 0.8, subscriptionPrice: 13999,   subscriptionOriginal: 27999 },
  BD: { name: 'Bangladesh',     currency: 'BDT', symbol: '৳',   pricePerCigarette: 7,    nicotinePerCigarette: 0.8, subscriptionPrice: 5499,    subscriptionOriginal: 10999 },
  MX: { name: 'Mexico',         currency: 'MXN', symbol: 'MX$', pricePerCigarette: 4.50, nicotinePerCigarette: 0.8, subscriptionPrice: 899,     subscriptionOriginal: 1799 },
  RU: { name: 'Russia',         currency: 'RUB', symbol: '₽',   pricePerCigarette: 8,    nicotinePerCigarette: 0.8, subscriptionPrice: 4499,    subscriptionOriginal: 8999 },
  KR: { name: 'South Korea',    currency: 'KRW', symbol: '₩',   pricePerCigarette: 225,  nicotinePerCigarette: 0.8, subscriptionPrice: 65000,   subscriptionOriginal: 129000 },
  IT: { name: 'Italy',          currency: 'EUR', symbol: '€',   pricePerCigarette: 0.35, nicotinePerCigarette: 0.8, subscriptionPrice: 45,      subscriptionOriginal: 89 },
  ES: { name: 'Spain',          currency: 'EUR', symbol: '€',   pricePerCigarette: 0.36, nicotinePerCigarette: 0.8, subscriptionPrice: 45,      subscriptionOriginal: 89 },
  NL: { name: 'Netherlands',    currency: 'EUR', symbol: '€',   pricePerCigarette: 0.64, nicotinePerCigarette: 0.8, subscriptionPrice: 45,      subscriptionOriginal: 89 },
  SE: { name: 'Sweden',         currency: 'SEK', symbol: 'kr',  pricePerCigarette: 3.50, nicotinePerCigarette: 0.8, subscriptionPrice: 529,     subscriptionOriginal: 1049 },
  NZ: { name: 'New Zealand',    currency: 'NZD', symbol: 'NZ$', pricePerCigarette: 1.80, nicotinePerCigarette: 0.8, subscriptionPrice: 80,      subscriptionOriginal: 159 },
  TH: { name: 'Thailand',       currency: 'THB', symbol: '฿',   pricePerCigarette: 6,    nicotinePerCigarette: 0.8, subscriptionPrice: 1799,    subscriptionOriginal: 3599 },
  VN: { name: 'Vietnam',        currency: 'VND', symbol: '₫',   pricePerCigarette: 1500, nicotinePerCigarette: 0.8, subscriptionPrice: 1199000, subscriptionOriginal: 2399000 },
}

export const DEFAULT_COUNTRY = 'IN'

const HIGH_VALUE_CURRENCIES = new Set(['IDR', 'VND', 'KRW', 'NGN', 'KES', 'PKR', 'BDT', 'JPY'])

export function getCountryConfig(countryCode?: string): CountryConfig {
  return COUNTRIES[countryCode || DEFAULT_COUNTRY] || COUNTRIES[DEFAULT_COUNTRY]
}

export function formatMoney(amount: number, countryCode?: string): string {
  const config = getCountryConfig(countryCode)
  if (HIGH_VALUE_CURRENCIES.has(config.currency)) {
    return `${config.symbol}${Math.round(amount).toLocaleString()}`
  }
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10
  return `${config.symbol}${rounded}`
}

export function getCountryList(): { code: string; name: string }[] {
  return Object.entries(COUNTRIES)
    .map(([code, config]) => ({ code, name: config.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getSubscriptionPrice(countryCode?: string): string {
  const config = getCountryConfig(countryCode)
  return formatMoney(config.subscriptionPrice, countryCode)
}

export function getSubscriptionOriginal(countryCode?: string): string {
  const config = getCountryConfig(countryCode)
  return formatMoney(config.subscriptionOriginal, countryCode)
}

export function getPaywallSavingsFrame(countryCode?: string, dailyCigs: number = 10): string {
  const config = getCountryConfig(countryCode)
  const monthlySaved = dailyCigs * config.pricePerCigarette * 30
  return formatMoney(monthlySaved, countryCode)
}

const GEO_CACHE = 'smono_geo_cc'
const GEO_FAIL = 'smono_geo_fail'
let geoInflight: Promise<string> | null = null

function rememberGeo(code: string): string {
  try {
    sessionStorage.setItem(GEO_CACHE, code)
  } catch {
    /* private mode */
  }
  return code
}

function countryFromLocale(): string | null {
  try {
    for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
      const m = String(tag).match(/-([A-Za-z]{2})\b/)
      if (!m) continue
      const cc = m[1]!.toUpperCase()
      if (COUNTRIES[cc]) return cc
    }
  } catch {
    /* ignore */
  }
  return null
}

function countryFromTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (/Calcutta|Kolkata|Delhi/.test(tz)) return 'IN'
    if (/London/.test(tz)) return 'GB'
    if (/Toronto|Vancouver|Montreal|Edmonton/.test(tz)) return 'CA'
    if (/America\//.test(tz)) return 'US'
    if (/Sydney|Melbourne|Brisbane|Perth|Adelaide/.test(tz)) return 'AU'
    if (/Auckland|Pacific\/Auckland/.test(tz)) return 'NZ'
    if (/Tokyo/.test(tz)) return 'JP'
    if (/Seoul/.test(tz)) return 'KR'
    if (/Dubai/.test(tz)) return 'AE'
    if (/Riyadh/.test(tz)) return 'SA'
    if (/Paris/.test(tz)) return 'FR'
    if (/Berlin/.test(tz)) return 'DE'
    if (/Rome/.test(tz)) return 'IT'
    if (/Madrid/.test(tz)) return 'ES'
    if (/Amsterdam/.test(tz)) return 'NL'
    if (/Stockholm/.test(tz)) return 'SE'
    if (/Europe\//.test(tz)) return 'DE'
  } catch {
    /* ignore */
  }
  return null
}

/** Billing country from network (IP), then locale/timezone, then IN. */
export async function detectCountryCode(): Promise<string> {
  try {
    const cached = sessionStorage.getItem(GEO_CACHE)
    if (cached && COUNTRIES[cached]) return cached
  } catch {
    /* ignore */
  }

  if (geoInflight) return geoInflight

  geoInflight = (async () => {
    try {
      if (!sessionStorage.getItem(GEO_FAIL)) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2500)
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as { country_code?: string }
        const cc = data?.country_code?.toUpperCase()
        if (cc && COUNTRIES[cc]) return rememberGeo(cc)
      }
    } catch {
      try {
        sessionStorage.setItem(GEO_FAIL, '1')
      } catch {
        /* ignore */
      }
    }

    const local = countryFromLocale() || countryFromTimezone()
    if (local) return rememberGeo(local)
    return rememberGeo(DEFAULT_COUNTRY)
  })()

  try {
    return await geoInflight
  } finally {
    geoInflight = null
  }
}

