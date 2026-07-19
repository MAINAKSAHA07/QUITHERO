/** Persist that the user already picked an app language (avoid re-asking). */
const CHOSEN_KEY = 'language_chosen'

export function hasChosenLanguage(): boolean {
  try {
    return localStorage.getItem(CHOSEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markLanguageChosen(lang?: string): void {
  try {
    localStorage.setItem(CHOSEN_KEY, '1')
    if (lang) localStorage.setItem('app_language', lang)
  } catch {
    /* ignore */
  }
}
