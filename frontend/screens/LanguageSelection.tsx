import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import { useApp } from '../context/AppContext'
import TranslatedText from '../components/TranslatedText'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
]

export default function LanguageSelection() {
  const { language: currentLanguage, setLanguage } = useApp()
  const [selectedLang, setSelectedLang] = useState<string | null>(currentLanguage || null)
  const navigate = useNavigate()

  // Update selected language when current language changes
  useEffect(() => {
    if (currentLanguage) {
      setSelectedLang(currentLanguage)
    }
  }, [currentLanguage])

  const handleContinue = () => {
    if (selectedLang) {
      setLanguage(selectedLang)
      // Clear translation cache when language changes
      import('../services/translation.service').then(({ translationService }) => {
        translationService.clearCache()
      })
      // Navigate back to previous page or onboarding if coming from initial setup
      const from = new URLSearchParams(window.location.search).get('from')
      if (from) {
        navigate(from)
      } else {
        navigate('/onboarding')
      }
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <TopNavigation left="logo" center="" right="" />
      
      <div className="max-w-md mx-auto px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            <TranslatedText text="Choose Your Language" />
          </h1>
          <p className="text-text-primary/70 mb-8">
            <TranslatedText text="You can change this later in settings" />
          </p>

          <div className="space-y-3 mb-8">
            {languages.map((lang) => (
              <motion.div
                key={lang.code}
                whileTap={{ scale: 0.98 }}
              >
                <GlassCard
                  onClick={() => setSelectedLang(lang.code)}
                  hover
                  className={`p-4 cursor-pointer transition-all ${
                    selectedLang === lang.code
                      ? 'ring-2 ring-brand-primary shadow-glow'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="text-lg font-medium text-text-primary">
                        {lang.name}
                      </span>
                    </div>
                    {selectedLang === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <GlassButton
            onClick={handleContinue}
            disabled={!selectedLang}
            fullWidth
            className="py-4 text-lg"
          >
            <TranslatedText text="Continue" />
          </GlassButton>
        </motion.div>
      </div>
    </div>
  )
}

