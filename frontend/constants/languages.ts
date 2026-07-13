import { Language } from '../types/enums'

export type AppLanguage = {
  code: Language
  name: string
  flag: string
  /** English label used in KYC onboarding options */
  kycLabel: string
}

export const APP_LANGUAGES: AppLanguage[] = [
  { code: Language.EN, name: 'English', flag: '🇺🇸', kycLabel: 'English' },
  { code: Language.HI, name: 'हिंदी', flag: '🇮🇳', kycLabel: 'Hindi' },
  { code: Language.MR, name: 'मराठी', flag: '🇮🇳', kycLabel: 'Marathi' },
  { code: Language.GU, name: 'ગુજરાતી', flag: '🇮🇳', kycLabel: 'Gujarati' },
  { code: Language.ES, name: 'Español', flag: '🇪🇸', kycLabel: 'Español' },
  { code: Language.FR, name: 'Français', flag: '🇫🇷', kycLabel: 'Français' },
  { code: Language.DE, name: 'Deutsch', flag: '🇩🇪', kycLabel: 'Deutsch' },
  { code: Language.IT, name: 'Italiano', flag: '🇮🇹', kycLabel: 'Italiano' },
  { code: Language.ZH, name: '中文', flag: '🇨🇳', kycLabel: '中文' },
]

export const KYC_LANGUAGE_OPTIONS = APP_LANGUAGES.map((l) => l.kycLabel)

export const LANGUAGE_BY_KYC_LABEL: Record<string, Language> = Object.fromEntries(
  APP_LANGUAGES.map((l) => [l.kycLabel, l.code])
) as Record<string, Language>

export function getLanguageDisplayName(code: string): string {
  return APP_LANGUAGES.find((l) => l.code === code)?.name ?? 'English'
}

// ponytail: dev-only guard — fails fast if enum and picker lists drift
if (import.meta.env?.DEV) {
  const enumCodes = Object.values(Language)
  const pickerCodes = APP_LANGUAGES.map((l) => l.code)
  console.assert(
    enumCodes.length === pickerCodes.length &&
      enumCodes.every((code) => pickerCodes.includes(code)),
    'APP_LANGUAGES must include every Language enum value exactly once'
  )
  console.assert(
    KYC_LANGUAGE_OPTIONS.length === APP_LANGUAGES.length,
    'KYC language options must cover all app languages'
  )
}
