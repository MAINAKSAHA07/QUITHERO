/**
 * Runnable check: npx tsx frontend/utils/languageChoice.check.ts
 * Uses a fake localStorage when run in Node.
 */
const store: Record<string, string> = {}
;(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = String(v)
  },
  removeItem: (k: string) => {
    delete store[k]
  },
}

async function main() {
  const { hasChosenLanguage, markLanguageChosen } = await import('./languageChoice')
  if (hasChosenLanguage()) throw new Error('expected unset')
  markLanguageChosen('hi')
  if (!hasChosenLanguage()) throw new Error('expected chosen')
  if (store.app_language !== 'hi') throw new Error('expected app_language')
  console.log('languageChoice.check: ok')
}

main()
