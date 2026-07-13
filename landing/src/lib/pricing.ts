export type CountryConfig = {
  currency: string
  symbol: string
  pricePerCigarette: number
  subscriptionPrice: number
  subscriptionOriginal: number
}

export const COUNTRIES: Record<string, CountryConfig> = {
  IN: { currency: 'INR', symbol: '₹', pricePerCigarette: 12, subscriptionPrice: 1999, subscriptionOriginal: 3999 },
  US: { currency: 'USD', symbol: '$', pricePerCigarette: 0.5, subscriptionPrice: 50, subscriptionOriginal: 99 },
  GB: { currency: 'GBP', symbol: '£', pricePerCigarette: 0.85, subscriptionPrice: 40, subscriptionOriginal: 79 },
  CA: { currency: 'CAD', symbol: 'C$', pricePerCigarette: 1, subscriptionPrice: 65, subscriptionOriginal: 129 },
  AU: { currency: 'AUD', symbol: 'A$', pricePerCigarette: 2.25, subscriptionPrice: 75, subscriptionOriginal: 149 },
  DE: { currency: 'EUR', symbol: '€', pricePerCigarette: 0.37, subscriptionPrice: 45, subscriptionOriginal: 89 },
  FR: { currency: 'EUR', symbol: '€', pricePerCigarette: 0.71, subscriptionPrice: 45, subscriptionOriginal: 89 },
  JP: { currency: 'JPY', symbol: '¥', pricePerCigarette: 30, subscriptionPrice: 7500, subscriptionOriginal: 14900 },
  BR: { currency: 'BRL', symbol: 'R$', pricePerCigarette: 0.5, subscriptionPrice: 250, subscriptionOriginal: 499 },
  ZA: { currency: 'ZAR', symbol: 'R', pricePerCigarette: 3.5, subscriptionPrice: 899, subscriptionOriginal: 1799 },
  AE: { currency: 'AED', symbol: 'د.إ', pricePerCigarette: 1, subscriptionPrice: 185, subscriptionOriginal: 369 },
  SA: { currency: 'SAR', symbol: '﷼', pricePerCigarette: 1, subscriptionPrice: 185, subscriptionOriginal: 369 },
  SG: { currency: 'SGD', symbol: 'S$', pricePerCigarette: 0.7, subscriptionPrice: 65, subscriptionOriginal: 129 },
  MY: { currency: 'MYR', symbol: 'RM', pricePerCigarette: 0.9, subscriptionPrice: 220, subscriptionOriginal: 439 },
  PH: { currency: 'PHP', symbol: '₱', pricePerCigarette: 7.5, subscriptionPrice: 2799, subscriptionOriginal: 5599 },
  ID: { currency: 'IDR', symbol: 'Rp', pricePerCigarette: 1500, subscriptionPrice: 799000, subscriptionOriginal: 1499000 },
  NG: { currency: 'NGN', symbol: '₦', pricePerCigarette: 100, subscriptionPrice: 29999, subscriptionOriginal: 59999 },
  KE: { currency: 'KES', symbol: 'KSh', pricePerCigarette: 20, subscriptionPrice: 6499, subscriptionOriginal: 12999 },
  PK: { currency: 'PKR', symbol: '₨', pricePerCigarette: 15, subscriptionPrice: 13999, subscriptionOriginal: 27999 },
  BD: { currency: 'BDT', symbol: '৳', pricePerCigarette: 7, subscriptionPrice: 5499, subscriptionOriginal: 10999 },
  MX: { currency: 'MXN', symbol: 'MX$', pricePerCigarette: 4.5, subscriptionPrice: 899, subscriptionOriginal: 1799 },
  RU: { currency: 'RUB', symbol: '₽', pricePerCigarette: 8, subscriptionPrice: 4499, subscriptionOriginal: 8999 },
  KR: { currency: 'KRW', symbol: '₩', pricePerCigarette: 225, subscriptionPrice: 65000, subscriptionOriginal: 129000 },
  IT: { currency: 'EUR', symbol: '€', pricePerCigarette: 0.35, subscriptionPrice: 45, subscriptionOriginal: 89 },
  ES: { currency: 'EUR', symbol: '€', pricePerCigarette: 0.36, subscriptionPrice: 45, subscriptionOriginal: 89 },
  NL: { currency: 'EUR', symbol: '€', pricePerCigarette: 0.64, subscriptionPrice: 45, subscriptionOriginal: 89 },
  SE: { currency: 'SEK', symbol: 'kr', pricePerCigarette: 3.5, subscriptionPrice: 529, subscriptionOriginal: 1049 },
  NZ: { currency: 'NZD', symbol: 'NZ$', pricePerCigarette: 1.8, subscriptionPrice: 80, subscriptionOriginal: 159 },
  TH: { currency: 'THB', symbol: '฿', pricePerCigarette: 6, subscriptionPrice: 1799, subscriptionOriginal: 3599 },
  VN: { currency: 'VND', symbol: '₫', pricePerCigarette: 1500, subscriptionPrice: 1199000, subscriptionOriginal: 2399000 },
}

export const DEFAULT_COUNTRY = 'IN'
const HIGH_VALUE = new Set(['IDR', 'VND', 'KRW', 'NGN', 'KES', 'PKR', 'BDT', 'JPY'])
const CACHE_KEY = 'smono_geo_cc'
const FAIL_KEY = 'smono_geo_fail'

let inflight: Promise<string> | null = null

export function formatMoney(amount: number, config: CountryConfig): string {
  if (HIGH_VALUE.has(config.currency)) {
    return `${config.symbol}${Math.round(amount).toLocaleString()}`
  }
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 100) / 100
  const display = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '')
  return `${config.symbol}${display}`
}

function remember(code: string): string {
  try {
    sessionStorage.setItem(CACHE_KEY, code)
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
      const cc = m[1].toUpperCase()
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
    if (/Shanghai|Hong_Kong|Taipei/.test(tz)) return 'SG'
    if (/Singapore/.test(tz)) return 'SG'
    if (/Dubai/.test(tz)) return 'AE'
    if (/Riyadh/.test(tz)) return 'SA'
    if (/Sao_Paulo|Brazil/.test(tz)) return 'BR'
    if (/Mexico_City/.test(tz)) return 'MX'
    if (/Johannesburg/.test(tz)) return 'ZA'
    if (/Lagos/.test(tz)) return 'NG'
    if (/Nairobi/.test(tz)) return 'KE'
    if (/Karachi/.test(tz)) return 'PK'
    if (/Dhaka/.test(tz)) return 'BD'
    if (/Jakarta/.test(tz)) return 'ID'
    if (/Bangkok/.test(tz)) return 'TH'
    if (/Ho_Chi_Minh|Saigon/.test(tz)) return 'VN'
    if (/Kuala_Lumpur/.test(tz)) return 'MY'
    if (/Manila/.test(tz)) return 'PH'
    if (/Moscow/.test(tz)) return 'RU'
    if (/Paris|Europe\/Paris/.test(tz)) return 'FR'
    if (/Berlin|Europe\/Berlin/.test(tz)) return 'DE'
    if (/Rome|Europe\/Rome/.test(tz)) return 'IT'
    if (/Madrid|Europe\/Madrid/.test(tz)) return 'ES'
    if (/Amsterdam|Europe\/Amsterdam/.test(tz)) return 'NL'
    if (/Stockholm|Europe\/Stockholm/.test(tz)) return 'SE'
    if (/Europe\//.test(tz)) return 'DE'
  } catch {
    /* ignore */
  }
  return null
}

function isLocalDev(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')
}

/** Resolve pricing country without spamming geo APIs (CORS/429 on localhost). */
export async function detectCountryCode(): Promise<string> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached && COUNTRIES[cached]) return cached
  } catch {
    /* ignore */
  }

  if (inflight) return inflight

  inflight = (async () => {
    const local = countryFromLocale() || countryFromTimezone()
    if (local) return remember(local)

    // ponytail: skip third-party geo on localhost — CORS + free-tier 429
    if (isLocalDev()) return remember(DEFAULT_COUNTRY)

    try {
      if (sessionStorage.getItem(FAIL_KEY)) return remember(DEFAULT_COUNTRY)
    } catch {
      /* ignore */
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1800)
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { country_code?: string }
      const cc = data?.country_code?.toUpperCase()
      if (cc && COUNTRIES[cc]) return remember(cc)
    } catch {
      try {
        sessionStorage.setItem(FAIL_KEY, '1')
      } catch {
        /* ignore */
      }
    }

    return remember(DEFAULT_COUNTRY)
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export function getCountryConfig(code?: string): CountryConfig {
  return COUNTRIES[code || DEFAULT_COUNTRY] || COUNTRIES[DEFAULT_COUNTRY]
}
