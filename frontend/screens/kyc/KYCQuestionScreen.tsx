import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'
import { KYCQuestion } from './kycQuestions'
import { getCountryList } from '../../utils/currency'

interface KYCQuestionScreenProps {
  question: KYCQuestion
  value: any
  onChange: (val: any) => void
  onNext: () => void
  onBack: () => void
  step: number
  totalSteps: number
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
}: KYCQuestionScreenProps) {
  const [error, setError] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)

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
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5">
      {/* Navigation & Header (Fixed) */}
      <div className="flex-shrink-0">
        <div className="w-full flex items-center justify-between p-4 bg-background/50 backdrop-blur-md border-b border-white/5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-text-primary/70 hover:text-text-primary text-sm font-semibold transition-all px-3 py-1.5 rounded-full glass-subtle"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-text-primary/60 text-xs font-bold uppercase tracking-wider">
            Onboarding Progress
          </span>
          <span className="text-brand-primary text-sm font-bold">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-accent shadow-glow"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
        <GlassCard className="p-6 border-white/10 shadow-glow relative overflow-hidden bg-background-card/45 backdrop-blur-xl mb-4">
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2 className="text-xl font-bold text-text-primary leading-tight">
              {question.question}
            </h2>
            {question.whyWeAsk && (
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-text-primary/40 hover:text-brand-primary transition-all p-1 flex-shrink-0"
                title="Why we ask this"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Optional Why We Ask card */}
          {showExplanation && question.whyWeAsk && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-xs text-text-primary/80 mb-5 leading-relaxed"
            >
              <strong>Why we ask:</strong> {question.whyWeAsk}
            </motion.div>
          )}

          <p className="text-sm text-text-primary/60 mb-6 leading-relaxed">
            {question.support}
          </p>

          {/* Render inputs based on question type */}
          <div className="my-4">
            {question.type === 'text' && (
              <GlassInput
                type="text"
                value={value || ''}
                placeholder="Type your answer here..."
                onChange={(e) => onChange(e.target.value)}
                className="py-3 px-4 text-base"
                autoFocus
              />
            )}

            {question.type === 'textarea' && (
              <textarea
                value={value || ''}
                placeholder="Type your answer here (optional)..."
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full glass-input p-4 rounded-xl text-text-primary bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all text-base leading-relaxed"
              />
            )}

            {question.type === 'slider' && (
              <div className="space-y-6">
                <div className="text-center p-4 rounded-2xl glass-subtle">
                  <span className="text-3xl font-extrabold text-brand-primary">
                    {getDisplayValue()}
                  </span>
                  {question.unit && (
                    <span className="text-sm text-text-primary/75 ml-1.5 font-medium">
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
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="flex justify-between text-xs text-text-primary/45 font-medium px-1">
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
                      onClick={() => onChange(option)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-primary/10 border-brand-primary ring-1 ring-brand-primary/30'
                          : 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm font-medium text-text-primary">{option}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
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
                  <div className="text-right text-xs text-text-primary/45 font-semibold mb-2">
                    Max selection: {question.maxSelect} ({Array.isArray(value) ? value.length : 0} selected)
                  </div>
                )}
                {question.options?.map((option) => {
                  const isSelected = Array.isArray(value) && value.includes(option)
                  return (
                    <button
                      key={option}
                      onClick={() => handleMultiSelectToggle(option)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-primary/10 border-brand-primary ring-1 ring-brand-primary/30'
                          : 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm font-medium text-text-primary">{option}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
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
                  className="w-full glass-input py-3.5 px-4 rounded-xl text-text-primary bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all text-base"
                >
                  <option value="" className="bg-[#030712] text-text-primary/50">
                    Select your country
                  </option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#030712] text-text-primary">
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
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 font-semibold text-center mt-3"
            >
              {error}
            </motion.p>
          )}
        </GlassCard>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 p-4 pb-6 bg-background/80 backdrop-blur-md border-t border-white/5">
        <GlassButton
          onClick={handleContinue}
          fullWidth
          className="py-3.5 text-base font-bold flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </div>
  )
}
