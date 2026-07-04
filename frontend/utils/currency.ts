export interface CountryConfig {
  name: string
  currency: string
  symbol: string
  pricePerCigarette: number
  nicotinePerCigarette: number
}

export const COUNTRIES: Record<string, CountryConfig> = {
  IN: { name: 'India',          currency: 'INR', symbol: '₹',   pricePerCigarette: 12,   nicotinePerCigarette: 0.8 },
  US: { name: 'United States',  currency: 'USD', symbol: '$',   pricePerCigarette: 0.50, nicotinePerCigarette: 0.8 },
  GB: { name: 'United Kingdom', currency: 'GBP', symbol: '£',   pricePerCigarette: 0.85, nicotinePerCigarette: 0.8 },
  CA: { name: 'Canada',         currency: 'CAD', symbol: 'C$',  pricePerCigarette: 1.00, nicotinePerCigarette: 0.8 },
  AU: { name: 'Australia',      currency: 'AUD', symbol: 'A$',  pricePerCigarette: 2.25, nicotinePerCigarette: 0.8 },
  DE: { name: 'Germany',        currency: 'EUR', symbol: '€',   pricePerCigarette: 0.37, nicotinePerCigarette: 0.8 },
  FR: { name: 'France',         currency: 'EUR', symbol: '€',   pricePerCigarette: 0.71, nicotinePerCigarette: 0.8 },
  JP: { name: 'Japan',          currency: 'JPY', symbol: '¥',   pricePerCigarette: 30,   nicotinePerCigarette: 0.8 },
  BR: { name: 'Brazil',         currency: 'BRL', symbol: 'R$',  pricePerCigarette: 0.50, nicotinePerCigarette: 0.8 },
  ZA: { name: 'South Africa',   currency: 'ZAR', symbol: 'R',   pricePerCigarette: 3.50, nicotinePerCigarette: 0.8 },
  AE: { name: 'UAE',            currency: 'AED', symbol: 'د.إ', pricePerCigarette: 1.00, nicotinePerCigarette: 0.8 },
  SA: { name: 'Saudi Arabia',   currency: 'SAR', symbol: '﷼',   pricePerCigarette: 1.00, nicotinePerCigarette: 0.8 },
  SG: { name: 'Singapore',      currency: 'SGD', symbol: 'S$',  pricePerCigarette: 0.70, nicotinePerCigarette: 0.8 },
  MY: { name: 'Malaysia',       currency: 'MYR', symbol: 'RM',  pricePerCigarette: 0.90, nicotinePerCigarette: 0.8 },
  PH: { name: 'Philippines',    currency: 'PHP', symbol: '₱',   pricePerCigarette: 7.50, nicotinePerCigarette: 0.8 },
  ID: { name: 'Indonesia',      currency: 'IDR', symbol: 'Rp',  pricePerCigarette: 1500, nicotinePerCigarette: 0.8 },
  NG: { name: 'Nigeria',        currency: 'NGN', symbol: '₦',   pricePerCigarette: 100,  nicotinePerCigarette: 0.8 },
  KE: { name: 'Kenya',          currency: 'KES', symbol: 'KSh', pricePerCigarette: 20,   nicotinePerCigarette: 0.8 },
  PK: { name: 'Pakistan',       currency: 'PKR', symbol: '₨',   pricePerCigarette: 15,   nicotinePerCigarette: 0.8 },
  BD: { name: 'Bangladesh',     currency: 'BDT', symbol: '৳',   pricePerCigarette: 7,    nicotinePerCigarette: 0.8 },
  MX: { name: 'Mexico',         currency: 'MXN', symbol: 'MX$', pricePerCigarette: 4.50, nicotinePerCigarette: 0.8 },
  RU: { name: 'Russia',         currency: 'RUB', symbol: '₽',   pricePerCigarette: 8,    nicotinePerCigarette: 0.8 },
  KR: { name: 'South Korea',    currency: 'KRW', symbol: '₩',   pricePerCigarette: 225,  nicotinePerCigarette: 0.8 },
  IT: { name: 'Italy',          currency: 'EUR', symbol: '€',   pricePerCigarette: 0.35, nicotinePerCigarette: 0.8 },
  ES: { name: 'Spain',          currency: 'EUR', symbol: '€',   pricePerCigarette: 0.36, nicotinePerCigarette: 0.8 },
  NL: { name: 'Netherlands',    currency: 'EUR', symbol: '€',   pricePerCigarette: 0.64, nicotinePerCigarette: 0.8 },
  SE: { name: 'Sweden',         currency: 'SEK', symbol: 'kr',  pricePerCigarette: 3.50, nicotinePerCigarette: 0.8 },
  NZ: { name: 'New Zealand',    currency: 'NZD', symbol: 'NZ$', pricePerCigarette: 1.80, nicotinePerCigarette: 0.8 },
  TH: { name: 'Thailand',       currency: 'THB', symbol: '฿',   pricePerCigarette: 6,    nicotinePerCigarette: 0.8 },
  VN: { name: 'Vietnam',        currency: 'VND', symbol: '₫',   pricePerCigarette: 1500, nicotinePerCigarette: 0.8 },
}

export const DEFAULT_COUNTRY = 'IN'

export function getCountryConfig(countryCode?: string): CountryConfig {
  return COUNTRIES[countryCode || DEFAULT_COUNTRY] || COUNTRIES[DEFAULT_COUNTRY]
}

export function formatMoney(amount: number, countryCode?: string): string {
  const config = getCountryConfig(countryCode)
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10
  return `${config.symbol}${rounded}`
}

export function getCountryList(): { code: string; name: string }[] {
  return Object.entries(COUNTRIES)
    .map(([code, config]) => ({ code, name: config.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
