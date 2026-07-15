import { Language } from '../types/enums'

/**
 * Kalam covers Latin + Devanagari (EN / HI / MR + Latin EU).
 * CJK (and scripts without a free handwriting webfont) stay on Inter.
 */
const HANDWRITING_LANGS = new Set<string>([
  Language.EN,
  Language.ES,
  Language.FR,
  Language.DE,
  Language.IT,
  Language.HI,
  Language.MR,
])

export function usesHandwritingFont(language?: string | null): boolean {
  if (!language) return true // default app UI is English-first
  return HANDWRITING_LANGS.has(language)
}
