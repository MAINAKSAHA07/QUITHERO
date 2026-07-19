/** E.164 dial prefixes keyed by ISO country code (matches currency COUNTRIES). */
export const DIAL_BY_COUNTRY: Record<string, string> = {
  IN: '+91',
  US: '+1',
  GB: '+44',
  CA: '+1',
  AU: '+61',
  DE: '+49',
  FR: '+33',
  JP: '+81',
  BR: '+55',
  ZA: '+27',
  AE: '+971',
  SA: '+966',
  SG: '+65',
  MY: '+60',
  PH: '+63',
  ID: '+62',
  NG: '+234',
  KE: '+254',
  PK: '+92',
  BD: '+880',
  MX: '+52',
  RU: '+7',
  KR: '+82',
  IT: '+39',
  ES: '+34',
  NL: '+31',
  SE: '+46',
  NZ: '+64',
  TH: '+66',
  VN: '+84',
}

export const DEFAULT_DIAL = DIAL_BY_COUNTRY.IN

export function dialForCountry(countryCode?: string): string {
  if (!countryCode) return DEFAULT_DIAL
  return DIAL_BY_COUNTRY[countryCode] || DEFAULT_DIAL
}

/** Unique dial options for a select (keeps first country label win for shared +1). */
export function dialOptions(): { dial: string; label: string }[] {
  const seen = new Set<string>()
  const out: { dial: string; label: string }[] = []
  for (const [code, dial] of Object.entries(DIAL_BY_COUNTRY)) {
    if (seen.has(dial)) continue
    seen.add(dial)
    out.push({ dial, label: `${dial} (${code})` })
  }
  return out.sort((a, b) => a.dial.localeCompare(b.dial))
}

/** Split stored "+919876543210" → { dial: "+91", local: "9876543210" } */
export function splitPhone(phone: string, fallbackDial = DEFAULT_DIAL): { dial: string; local: string } {
  const raw = String(phone || '').trim()
  if (!raw) return { dial: fallbackDial, local: '' }
  const digits = raw.replace(/[^\d+]/g, '')
  const withPlus = digits.startsWith('+') ? digits : `+${digits.replace(/\D/g, '')}`
  const sorted = Object.values(DIAL_BY_COUNTRY).sort((a, b) => b.length - a.length)
  for (const dial of sorted) {
    if (withPlus.startsWith(dial)) {
      return { dial, local: withPlus.slice(dial.length).replace(/\D/g, '') }
    }
  }
  return { dial: fallbackDial, local: withPlus.replace(/\D/g, '') }
}

export function joinPhone(dial: string, local: string): string {
  const d = dial.startsWith('+') ? dial : `+${dial.replace(/\D/g, '')}`
  const n = local.replace(/\D/g, '')
  return n ? `${d}${n}` : ''
}

export function isValidE164Phone(phone: string): boolean {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}
