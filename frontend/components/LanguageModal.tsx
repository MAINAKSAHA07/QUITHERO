import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Globe } from 'lucide-react'
import GlassCard from './GlassCard'
import GlassButton from './GlassButton'
import { useApp } from '../context/AppContext'
import TranslatedText from './TranslatedText'
import { profileService } from '../services/profile.service'
import { analyticsService } from '../services/analytics.service'
import { Language } from '../types/enums'
import { APP_LANGUAGES } from '../constants/languages'
import { markLanguageChosen } from '../utils/languageChoice'

interface LanguageModalProps {
  isOpen: boolean
  onClose: () => void
  onLanguageSelected?: (lang: string) => void
  showSkip?: boolean
}

export default function LanguageModal({
  isOpen,
  onClose,
  onLanguageSelected,
  showSkip = false,
}: LanguageModalProps) {
  const { user, language: currentLanguage, setLanguage, updateUserProfile } = useApp()
  const [selectedLang, setSelectedLang] = useState<string>(currentLanguage || 'en')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentLanguage) setSelectedLang(currentLanguage)
  }, [currentLanguage])

  const applyLanguage = async (code: string) => {
    if (!code || saving) return
    setSelectedLang(code)
    setSaving(true)
    try {
      setLanguage(code)
      markLanguageChosen(code)

      const { translationService } = await import('../services/translation.service')
      translationService.clearCache()

      if (user?.id) {
        try {
          const result = await profileService.updateProfile(user.id, {
            language: code as Language,
          })
          if (result.success && result.data && updateUserProfile) {
            await updateUserProfile(result.data)
          }
          await analyticsService.trackEvent('language_changed', { language: code }, user.id)
        } catch (error) {
          console.error('Failed to save language to profile:', error)
        }
      }

      onLanguageSelected?.(code)
      onClose()
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (!currentLanguage) setLanguage('en')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={showSkip ? handleSkip : undefined}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 relative">
                {showSkip && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-text-primary/70" />
                  </button>
                )}

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    <TranslatedText text="Choose Your Language" />
                  </h2>
                  <p className="text-text-primary/70 text-sm">
                    <TranslatedText text="Select your preferred language for the app" />
                  </p>
                </div>

                <div className="space-y-2 mb-4 max-h-[60vh] overflow-y-auto">
                  {APP_LANGUAGES.map((lang) => (
                    <motion.button
                      key={lang.code}
                      type="button"
                      onClick={() => void applyLanguage(lang.code)}
                      disabled={saving}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-xl transition-all text-left disabled:opacity-60 ${
                        selectedLang === lang.code
                          ? 'bg-brand-primary/10 ring-2 ring-brand-primary'
                          : 'glass-subtle hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="font-medium text-text-primary">{lang.name}</span>
                        </div>
                        {selectedLang === lang.code && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {saving ? (
                  <p className="text-center text-sm text-text-primary/50 mb-2">
                    <TranslatedText text="Saving..." />
                  </p>
                ) : null}

                {showSkip ? (
                  <GlassButton
                    variant="secondary"
                    onClick={handleSkip}
                    disabled={saving}
                    className="w-full py-3"
                  >
                    <TranslatedText text="Skip" />
                  </GlassButton>
                ) : null}
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
