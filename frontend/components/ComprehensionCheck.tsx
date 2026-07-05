import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Sparkles, X } from 'lucide-react'
import GlassCard from './GlassCard'
import GlassButton from './GlassButton'
import { ComprehensionCheckContent } from '../types/models'

interface ComprehensionCheckProps {
  check: ComprehensionCheckContent
  onPass: (result: { selected_index: number; selected: string }) => void
  onReview: () => void
  onFail?: (result: { selected_index: number; selected: string }) => void
}

export default function ComprehensionCheck({ check, onPass, onReview, onFail }: ComprehensionCheckProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showThoughtPopup, setShowThoughtPopup] = useState(false)

  const handleSubmit = () => {
    if (selected === null) return
    setSubmitted(true)
    if (selected === check.correct_index) {
      setTimeout(() => onPass({ selected_index: selected, selected: check.options[selected] }), 600)
    } else {
      onFail?.({ selected_index: selected, selected: check.options[selected] })
      setShowThoughtPopup(true)
    }
  }

  const handleTryAgain = () => {
    setShowThoughtPopup(false)
    setSubmitted(false)
    setSelected(null)
  }

  return (
    <>
      <GlassCard className="p-5 mb-4 border-brand-accent/25 bg-brand-accent/5">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-accent flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Quick comprehension check
          </span>
          <h3 className="text-base font-bold text-text-primary mt-2 leading-snug">{check.question}</h3>
          <p className="text-xs text-text-primary/55 mt-1">Make sure you&apos;ve absorbed today&apos;s lesson.</p>
        </div>

        <div className="space-y-2">
          {check.options.map((option, index) => {
            const isSelected = selected === index
            const isCorrect = submitted && index === check.correct_index
            const isWrongPick = submitted && isSelected && index !== check.correct_index

            let style = 'border-white/10 bg-white/5 hover:border-brand-accent/40'
            if (isSelected && !submitted) style = 'border-brand-accent bg-brand-accent/10'
            if (isCorrect) style = 'border-emerald-500 bg-emerald-500/10'
            if (isWrongPick) style = 'border-red-500/70 bg-red-500/10'

            return (
              <button
                key={index}
                type="button"
                disabled={submitted && selected === check.correct_index}
                onClick={() => !submitted && setSelected(index)}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm font-medium ${style}`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {submitted && selected === check.correct_index && (
          <p className="mt-3 text-sm text-emerald-400 font-semibold">✓ Well understood. Continuing…</p>
        )}

        {!submitted && (
          <GlassButton
            onClick={handleSubmit}
            disabled={selected === null}
            fullWidth
            className="mt-4 py-3.5 font-bold"
          >
            Check my answer
          </GlassButton>
        )}
      </GlassCard>

      <AnimatePresence>
        {showThoughtPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleTryAgain}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <GlassCard className="p-6 relative">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="absolute top-4 right-4 text-text-primary/50 hover:text-text-primary"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-4 text-brand-primary">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wide">Thought of the day</span>
                </div>

                <div className="space-y-3 mb-5">
                  <p className="text-text-primary font-semibold leading-relaxed italic">
                    &ldquo;{check.thought_of_the_day[0]}&rdquo;
                  </p>
                  <p className="text-text-primary/80 text-sm leading-relaxed italic">
                    &ldquo;{check.thought_of_the_day[1]}&rdquo;
                  </p>
                </div>

                <p className="text-sm text-text-primary/70 mb-5">{check.reread_hint}</p>

                <div className="flex flex-col gap-2">
                  <GlassButton onClick={onReview} fullWidth className="py-3 font-bold">
                    Re-read earlier content
                  </GlassButton>
                  <GlassButton variant="secondary" onClick={handleTryAgain} fullWidth className="py-3">
                    Try question again
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
