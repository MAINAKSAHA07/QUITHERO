import { useState, useEffect } from 'react'
import { useTranslation } from '../hooks/useTranslation'

interface TranslatedTextProps {
  text: string
  sourceLang?: string
  fallback?: string
  className?: string
}

/**
 * Component that automatically translates text based on current language
 */
export default function TranslatedText({ 
  text, 
  sourceLang = 'en', 
  fallback,
  className 
}: TranslatedTextProps) {
  const { t, currentLanguage } = useTranslation()
  const [translatedText, setTranslatedText] = useState(text)

  useEffect(() => {
    if (currentLanguage === sourceLang) {
      setTranslatedText(text)
      return
    }

    // Translate text
    t(text, sourceLang).then(setTranslatedText).catch(() => {
      setTranslatedText(fallback || text)
    })
  }, [text, currentLanguage, sourceLang, t, fallback])

  return <span className={className}>{translatedText}</span>
}
