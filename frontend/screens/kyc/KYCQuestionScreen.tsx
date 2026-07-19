import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import TranslatedText from '../../components/TranslatedText'
import { KYCQuestion } from './kycQuestions'
import { getCountryList } from '../../utils/currency'
import { useLiveTranslation } from '../../hooks/useTranslation'
import { useMotionPrefs } from '../../hooks/useMotionPrefs'
import { dialForCountry, dialOptions, splitPhone, joinPhone, isValidE164Phone } from '../../utils/phone'

const optionBase =
  'w-full flex items-center justify-between p-4 rounded-xl border text-left transition-[transform,background-color,border-color,box-shadow] duration-100 ease-out active:scale-[0.98]'
const optionIdle = 'bg-white/5 border-white/15 active:bg-white/10'
const optionSelected =
  'bg-[#3F8DD2]/12 border-[#3F8DD2]/55 shadow-[0_0_0_2px_rgba(63,141,210,0.22)]'

interface KYCQuestionScreenProps {
  question: KYCQuestion
  value: any
  onChange: (val: any) => void
  onNext: () => void
  onBack: () => void
  step: number
  totalSteps: number
  /** ISO country from earlier KYC answer — drives default dial code */
  countryCode?: string
}

const countries = getCountryList()

export default function KYCQuestionScreen({
  question,
  value,
  onChange,
  onNext,
  onBack,
  step,
  totalSteps,
  countryCode,
}: KYCQuestionScreenProps) {
  const [error, setError] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const { springUi, fade } = useMotionPrefs()
  const defaultDial = dialForCountry(countryCode)
  const phoneParts = useMemo(
    () => splitPhone(String(value || ''), defaultDial),
    // only re-split when the stored value or country default changes
    [value, defaultDial]
  )
  const [phoneDial, setPhoneDial] = useState(phoneParts.dial)
  const [phoneLocal, setPhoneLocal] = useState(phoneParts.local)
  const dialOpts = useMemo(() => dialOptions(), [])

  useEffect(() => {
    const next = splitPhone(String(value || ''), defaultDial)
    setPhoneDial(next.dial)
    setPhoneLocal(next.local)
  }, [value, defaultDial])

  // When country changes and local number empty, adopt that country's dial
  useEffect(() => {
    if (question.id !== 'phone') return
    if (phoneLocal) return
    setPhoneDial(defaultDial)
  }, [defaultDial, question.id, phoneLocal])

  const phonePlaceholder = useLiveTranslation('Mobile number')
  const textPlaceholder = useLiveTranslation('Type your answer here...')
  const textareaPlaceholder = useLiveTranslation('Type your answer here (optional)...')
  const countryPlaceholder = useLiveTranslation('Select your country')
  const maxSelectLabel = useLiveTranslation(
    question.maxSelect
      ? `Max selection: ${question.maxSelect} (${Array.isArray(value) ? value.length : 0} selected)`
      : ''
  )

  const emitPhone = (dial: string, local: string) => {
    setPhoneDial(dial)
    setPhoneLocal(local)
    onChange(joinPhone(dial, local))
  }

  // Validation
  const handleContinue = () => {
    setError('')

    if (question.required) {
      if (value === undefined || value === null || value === '') {
        setError('This field is required')
        return
      }
      if (Array.isArray(value) && value.length === 0) {
        setError('Please select at least one option')
        return
      }
    }

    if (question.id === 'pack_cost' && Number(value) <= 0) {
      setError('Cost must be greater than zero')
      return
    }

    if (question.id === 'daily_consumption' && Number(value) <= 0) {
      setError('Consumption must be at least 1')
      return
    }

    if (question.id === 'phone') {
      if (!isValidE164Phone(String(value || ''))) {
        setError('Enter a valid phone number with country code')
        return
      }
    }

    onNext()
  }

  // Toggle multi-select options
  const handleMultiSelectToggle = (option: string) => {
    const currentList = Array.isArray(value) ? [...value] : []
    let updated: string[]

    if (currentList.includes(option)) {
      updated = currentList.filter((o) => o !== option)
    } else {
      if (question.maxSelect && currentList.length >= question.maxSelect) {
        setError(`You can select a maximum of ${question.maxSelect} options`)
        return
      }
      updated = [...currentList, option]
      setError('')
    }
    onChange(updated)
  }

  // Value formatting for display
  const getDisplayValue = () => {
    if (value === undefined || value === null || value === '') {
      return question.type === 'slider' ? question.min : '-'
    }
    return value
  }

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#F4FBFF] relative">
      {/* Navigation & Header (Fixed) */}
      <div className="flex-shrink-0">
        <div className="w-full flex items-center justify-between p-4 bg-[#F4FBFF]/92 border-b border-[#0E2538]/06 safe-area-top">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#0E2538]/70 text-sm font-semibold px-3 py-1.5 rounded-full bg-[#0E2538]/[0.05] active:scale-95 active:bg-[#0E2538]/10 transition-[transform,background-color] duration-100"
          >
            <ArrowLeft className="w-4 h-4" /> <TranslatedText text="Back" />
          </button>
          <span className="text-[#0E2538]/45 text-xs font-semibold tracking-wide">
            <TranslatedText text="Setup" />
          </span>
          <span className="text-[#3F8DD2] text-sm font-bold tabular-nums">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-1 bg-[#0E2538]/06">
          <motion.div
            className="h-full bg-[#3F8DD2]"
            initial={false}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={springUi}
          />
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
        <GlassCard className="p-6 relative overflow-hidden mb-4" borderGlow={false}>
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2 className="text-xl font-bold text-[#0E2538] leading-tight tracking-tight">
              <TranslatedText text={question.question} />
            </h2>
            {question.whyWeAsk && (
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className={`p-1.5 flex-shrink-0 rounded-full transition-[transform,color,background-color] duration-100 active:scale-95 ${
                  showExplanation ? 'text-[#3F8DD2] bg-[#3F8DD2]/10' : 'text-[#0E2538]/35 active:text-[#3F8DD2]'
                }`}
                title="Why we ask this"
                aria-pressed={showExplanation}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Optional Why We Ask card */}
          {showExplanation && question.whyWeAsk && (
            <motion.div
              {...fade}
              transition={springUi}
              className="p-4 rounded-xl bg-[#3F8DD2]/08 border border-[#3F8DD2]/20 text-xs text-[#0E2538]/75 mb-5 leading-relaxed"
            >
              <strong><TranslatedText text="Why we ask:" /></strong>{' '}
              <TranslatedText text={question.whyWeAsk} />
            </motion.div>
          )}

          <p className="text-sm text-[#0E2538]/55 mb-6 leading-relaxed">
            <TranslatedText text={question.support || ''} />
          </p>

          {/* Render inputs based on question type */}
          <div className="my-4">
            {question.type === 'text' && question.id === 'phone' && (
              <div className="flex gap-2">
                <select
                  value={phoneDial}
                  onChange={(e) => emitPhone(e.target.value, phoneLocal)}
                  className="glass-input rounded-xl px-2 py-3 text-sm text-text-primary bg-white/5 border border-white/10 outline-none max-w-[7.5rem] flex-shrink-0"
                  aria-label="Country code"
                >
                  {dialOpts.map((o) => (
                    <option key={o.dial} value={o.dial}>
                      {o.dial}
                    </option>
                  ))}
                </select>
                <GlassInput
                  type="tel"
                  inputMode="tel"
                  value={phoneLocal}
                  placeholder={phonePlaceholder}
                  onChange={(e) => emitPhone(phoneDial, e.target.value)}
                  className="py-3 px-4 text-base flex-1"
                  autoFocus
                />
              </div>
            )}

            {question.type === 'text' && question.id !== 'phone' && (
              <GlassInput
                type="text"
                value={value || ''}
                placeholder={textPlaceholder}
                onChange={(e) => onChange(e.target.value)}
                className="py-3 px-4 text-base"
                autoFocus
              />
            )}

            {question.type === 'textarea' && (
              <textarea
                value={value || ''}
                placeholder={textareaPlaceholder}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full glass-input p-4 rounded-2xl text-[#0E2538] outline-none text-base leading-relaxed focus:!border-[#3F8DD2]/50"
              />
            )}

            {question.type === 'slider' && (
              <div className="space-y-6">
                <div className="text-center p-4 rounded-2xl bg-[#0E2538]/[0.04]">
                  <span className="text-3xl font-extrabold text-[#3F8DD2] tracking-tight">
                    {getDisplayValue()}
                  </span>
                  {question.unit && (
                    <span className="text-sm text-[#0E2538]/55 ml-1.5 font-medium">
                      {question.unit}
                    </span>
                  )}
                </div>
                <input
                  type="range"
                  min={question.min ?? 1}
                  max={question.max ?? 10}
                  step={question.step ?? 1}
                  value={value ?? question.min ?? 1}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="w-full h-2 bg-[#0E2538]/10 rounded-lg appearance-none cursor-pointer accent-[#3F8DD2]"
                />
                <div className="flex justify-between text-xs text-[#0E2538]/40 font-medium px-1">
                  <span>{question.min}</span>
                  <span>{question.max}</span>
                </div>
              </div>
            )}

            {question.type === 'single_select' && (
              <div className="space-y-2.5">
                {question.options?.map((option) => {
                  const isSelected = value === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onChange(option)}
                      aria-pressed={isSelected}
                      className={`${optionBase} ${isSelected ? optionSelected : optionIdle}`}
                    >
                      <span className="text-sm font-medium text-[#0E2538]">
                        <TranslatedText text={option} />
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#3F8DD2] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {question.type === 'multi_select' && (
              <div className="space-y-2.5">
                {question.maxSelect && (
                  <div className="text-right text-xs text-[#0E2538]/40 font-semibold mb-2">
                    {maxSelectLabel}
                  </div>
                )}
                {question.options?.map((option) => {
                  const isSelected = Array.isArray(value) && value.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleMultiSelectToggle(option)}
                      aria-pressed={isSelected}
                      className={`${optionBase} ${isSelected ? optionSelected : optionIdle}`}
                    >
                      <span className="text-sm font-medium text-[#0E2538]">
                        <TranslatedText text={option} />
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#3F8DD2] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {question.type === 'country_select' && (
              <div className="space-y-2.5">
                <select
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full glass-input py-3.5 px-4 rounded-2xl text-[#0E2538] outline-none text-base focus:!border-[#3F8DD2]/50"
                >
                  <option value="">
                    {countryPlaceholder}
                  </option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Validation feedback */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-error font-semibold text-center mt-3"
              role="alert"
            >
              <TranslatedText text={error} />
            </motion.p>
          )}
        </GlassCard>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-[#F4FBFF]/92 border-t border-[#0E2538]/06">
        <GlassButton
          onClick={handleContinue}
          fullWidth
          className="py-3.5 text-base font-bold flex items-center justify-center gap-2"
        >
          <TranslatedText text="Continue" /> <ArrowRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </div>
  )
}
