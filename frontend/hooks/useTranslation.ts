import { useState, useCallback, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { translationService } from '../services/translation.service'

/**
 * Hook for translating text in React components
 * Automatically uses the current language from AppContext
 */
export function useTranslation() {
  const { language } = useApp()
  const [isTranslating, setIsTranslating] = useState(false)

  const t = useCallback(
    async (text: string, sourceLang: string = 'en'): Promise<string> => {
      if (!text || language === sourceLang) {
        return text
      }

      setIsTranslating(true)
      try {
        return await translationService.translate(text, language, sourceLang)
      } catch (error) {
        console.error('Translation error:', error)
        return text
      } finally {
        setIsTranslating(false)
      }
    },
    [language]
  )

  const translateBatch = useCallback(
    async (texts: string[], sourceLang: string = 'en'): Promise<string[]> => {
      if (language === sourceLang) {
        return texts
      }

      setIsTranslating(true)
      try {
        return await translationService.translateBatch(texts, language, sourceLang)
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

/** Live-updating translated string for longer bodies (sessions, KYC copy). */
export function useLiveTranslation(text: string, sourceLang: string = 'en'): string {
  const { language } = useApp()
  const [out, setOut] = useState(text)

  useEffect(() => {
    let cancelled = false
    if (!text || language === sourceLang) {
      setOut(text || '')
      return
    }
    setOut(text)
    translationService.translate(text, language, sourceLang).then((translated) => {
      if (!cancelled) setOut(translated)
    })
    return () => {
      cancelled = true
    }
  }, [text, language, sourceLang])

  return out
}

/**
 * Hook for synchronous translation with cached results
 */
export function useTranslationSync() {
  const { language } = useApp()
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())

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

      translationService.translate(text, language, sourceLang).then((translated) => {
        setTranslations((prev) => {
          const newMap = new Map(prev)
          newMap.set(cacheKey, translated)
          return newMap
        })
      })

      return text
    },
    [language, translations]
  )

  return {
    t,
    currentLanguage: language,
  }
}
