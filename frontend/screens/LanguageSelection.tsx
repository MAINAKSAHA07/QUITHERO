import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import { useApp } from '../context/AppContext'
import TranslatedText from '../components/TranslatedText'
import { profileService } from '../services/profile.service'
import { analyticsService } from '../services/analytics.service'
import { Language } from '../types/enums'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
]

export default function LanguageSelection() {
  const { user, language: currentLanguage, setLanguage, updateUserProfile } = useApp()
  const [selectedLang, setSelectedLang] = useState<string | null>(currentLanguage || null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  // Update selected language when current language changes
  useEffect(() => {
    if (currentLanguage) {
      setSelectedLang(currentLanguage)
    }
  }, [currentLanguage])

  const handleContinue = async () => {
    if (!selectedLang) return

    setSaving(true)
    try {
      // Update language in context and localStorage
      setLanguage(selectedLang)
      
      // Clear translation cache when language changes
      const { translationService } = await import('../services/translation.service')
      translationService.clearCache()
      
      // If user is logged in, save language to user profile
      if (user?.id) {
        try {
          const result = await profileService.updateProfile(user.id, {
            language: selectedLang as Language,
          })
          
          if (result.success && result.data && updateUserProfile) {
            await updateUserProfile(result.data)
          }
          
          // Track analytics
          await analyticsService.trackEvent('language_changed', {
            language: selectedLang,
          }, user.id)
        } catch (error) {
          console.error('Failed to save language to profile:', error)
          // Don't block navigation if profile update fails
        }
      }
      
      // Navigate back to previous page or onboarding if coming from initial setup
      const from = new URLSearchParams(window.location.search).get('from')
      if (from) {
        navigate(from)
      } else {
        navigate('/onboarding')
      }
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setSaving(false)
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
            disabled={!selectedLang || saving}
            fullWidth
            className="py-4 text-lg"
          >
            {saving ? 'Saving...' : <TranslatedText text="Continue" />}
          </GlassButton>
        </motion.div>
      </div>
    </div>
  )
}

