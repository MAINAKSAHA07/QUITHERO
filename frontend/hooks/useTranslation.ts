import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { translationService } from '../services/translation.service'

/**
 * Hook for translating text in React components
 * Automatically uses the current language from AppContext
 */
export function useTranslation() {
  const { language } = useApp()
  const [isTranslating, setIsTranslating] = useState(false)

  /**
   * Translate a single text string
   */
  const t = useCallback(
    async (text: string, sourceLang: string = 'en'): Promise<string> => {
      if (!text || language === sourceLang) {
        return text
      }

      setIsTranslating(true)
      try {
        const translated = await translationService.translate(text, language, sourceLang)
        return translated
      } catch (error) {
        console.error('Translation error:', error)
        return text
      } finally {
        setIsTranslating(false)
      }
    },
    [language]
  )

  /**
   * Translate multiple texts at once
   */
  const translateBatch = useCallback(
    async (texts: string[], sourceLang: string = 'en'): Promise<string[]> => {
      if (language === sourceLang) {
        return texts
      }

      setIsTranslating(true)
      try {
        const translated = await translationService.translateBatch(texts, language, sourceLang)
        return translated
      } catch (error) {
        console.error('Batch translation error:', error)
        return texts
      } finally {
        setIsTranslating(false)
      }
    },
    [language]
  )

  return {
    t,
    translateBatch,
    isTranslating,
    currentLanguage: language,
  }
}

/**
 * Hook for synchronous translation with cached results
 * Use this for components that need immediate translation without async
 */
export function useTranslationSync() {
  const { language } = useApp()
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())

  /**
   * Get translated text (synchronous, uses cache)
   * If not cached, returns original text and triggers async translation
   */
  const t = useCallback(
    (text: string, sourceLang: string = 'en'): string => {
      if (!text || language === sourceLang) {
        return text
      }

      const cacheKey = `${sourceLang}-${language}-${text}`
      const cached = translations.get(cacheKey)
      
      if (cached) {
        return cached
      }

      // Trigger async translation and update cache
      translationService.translate(text, language, sourceLang).then((translated) => {
        setTranslations((prev) => {
          const newMap = new Map(prev)
          newMap.set(cacheKey, translated)
          return newMap
        })
      })

      // Return original text while translating
      return text
    },
    [language, translations]
  )

  return {
    t,
    currentLanguage: language,
  }
}
