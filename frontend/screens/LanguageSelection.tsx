import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import SmonoLogo from '../components/SmonoLogo'
import GlassCard from '../components/GlassCard'
import { useApp } from '../context/AppContext'
import { useMotionPrefs } from '../hooks/useMotionPrefs'
import TranslatedText from '../components/TranslatedText'
import { profileService } from '../services/profile.service'
import { analyticsService } from '../services/analytics.service'
import { Language } from '../types/enums'
import { APP_LANGUAGES } from '../constants/languages'
import { markLanguageChosen } from '../utils/languageChoice'

export default function LanguageSelection() {
  const { user, language: currentLanguage, setLanguage, updateUserProfile } = useApp()
  const [selectedLang, setSelectedLang] = useState<string | null>(currentLanguage || null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const { fade, springUi } = useMotionPrefs()

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

      const from = new URLSearchParams(window.location.search).get('from')
      navigate(from || '/onboarding')
    } catch (error) {
      console.error('Error changing language:', error)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100dvh] pb-20 bg-[#F4FBFF] safe-area-top">
      <div className="app-container px-3 sm:px-4 pt-10">
        <motion.div {...fade} transition={springUi}>
          <div className="flex flex-col items-center text-center mb-8">
            <SmonoLogo size="lg" showMascot className="mb-4" />
            <h1 className="text-3xl font-bold text-[#0E2538] mb-2 tracking-tight">
              <TranslatedText text="Choose Your Language" />
            </h1>
            <p className="text-[#0E2538]/55 mb-8">
              <TranslatedText text="You can change this later in settings" />
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {APP_LANGUAGES.map((lang) => {
              const selected = selectedLang === lang.code
              return (
                <motion.div key={lang.code} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                  <GlassCard
                    onClick={() => void applyLanguage(lang.code)}
                    borderGlow={false}
                    className={`p-4 cursor-pointer transition-[box-shadow,transform] duration-100 ${
                      saving ? 'opacity-60 pointer-events-none' : ''
                    } ${
                      selected
                        ? 'shadow-[0_0_0_2px_rgba(63,141,210,0.45)]'
                        : 'active:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl" aria-hidden>
                          {lang.flag}
                        </span>
                        <span className="text-lg font-medium text-[#0E2538]">{lang.name}</span>
                      </div>
                      {selected ? (
                        <div className="w-6 h-6 rounded-full bg-[#3F8DD2] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : null}
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
          {saving ? (
            <p className="text-center text-sm text-[#0E2538]/45">
              <TranslatedText text="Saving…" />
            </p>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
