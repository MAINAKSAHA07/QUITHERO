import { useState } from 'react'
import { Step } from '../../types/models'
import { MCQStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import TranslatedText from '../TranslatedText'
import { useLiveTranslation } from '../../hooks/useTranslation'

interface MCQStepComponentProps {
  step: Step
  onNext: (response: any) => void | Promise<boolean | void>
  readOnly?: boolean
  initialSelected?: number | null
  initialSelectedMultiple?: number[] | null
}

export default function MCQStepComponent({
  step,
  onNext,
  readOnly = false,
  initialSelected = null,
  initialSelectedMultiple = null,
}: MCQStepComponentProps) {
  const content = step.content_json as MCQStepContent
  const multi = !!content.allow_multiple
  const question = useLiveTranslation(content.question || '')
  const [selectedOption, setSelectedOption] = useState<number | null>(
    typeof initialSelected === 'number' ? initialSelected : null
  )
  const [selectedMultiple, setSelectedMultiple] = useState<number[]>(
    Array.isArray(initialSelectedMultiple) ? initialSelectedMultiple : []
  )
  const [isSubmitted, setIsSubmitted] = useState(
    readOnly &&
      (multi
        ? Array.isArray(initialSelectedMultiple) && initialSelectedMultiple.length > 0
        : typeof initialSelected === 'number')
  )
  const [busy, setBusy] = useState(false)

  const toggleMulti = (index: number) => {
    if (isSubmitted || readOnly) return
    setSelectedMultiple((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    )
  }

  // In review mode nothing is editable, so Continue must never be gated on a fresh
  // selection — old completions (pre-multi-select) have no saved options to restore.
  const canContinue = readOnly || (multi ? selectedMultiple.length > 0 : selectedOption !== null)

  const handleSubmit = async () => {
    if (!canContinue || busy) return

    const payload = multi
      ? { selected_options: selectedMultiple }
      : { selected_option: selectedOption }

    if (readOnly) {
      setBusy(true)
      try {
        await onNext(payload)
      } finally {
        setBusy(false)
      }
      return
    }

    if (!isSubmitted) {
      setIsSubmitted(true)
      return
    }

    setBusy(true)
    try {
      await onNext(payload)
    } finally {
      setBusy(false)
    }
  }

  const hasCorrectAnswer =
    !multi && content.correct_answer !== undefined && content.correct_answer !== null

  return (
    <div className="space-y-6">
      {readOnly && (
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
          Saved answer · read only
        </p>
      )}
      <h3 className="text-lg sm:text-xl font-black text-text-primary leading-snug">
        {question}
      </h3>
      {multi && !readOnly && (
        <p className="text-sm text-text-primary/55 -mt-3">
          <TranslatedText text="Select all that still feel true (1 or more)." />
        </p>
      )}
      <div className="space-y-3">
        {content.options.map((option, index) => {
          const isSelected = multi
            ? selectedMultiple.includes(index)
            : selectedOption === index
          const isCorrect = hasCorrectAnswer && content.correct_answer === index
          const isIncorrectSelection =
            isSelected && hasCorrectAnswer && content.correct_answer !== index

          let optionStyle = 'hover:border-brand-primary/45 border-white/5 bg-white/5'
          if (isSelected) {
            optionStyle = 'border-brand-primary bg-brand-primary/10 shadow-glow'
          }
          if (isSubmitted && hasCorrectAnswer) {
            if (isCorrect) {
              optionStyle = 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/10'
            } else if (isIncorrectSelection) {
              optionStyle = 'border-red-500 bg-red-500/10 shadow-red-500/10'
            } else {
              optionStyle = 'opacity-40 border-white/5 bg-white/5'
            }
          }

          return (
            <button
              key={index}
              type="button"
              disabled={isSubmitted || readOnly}
              onClick={() => (multi ? toggleMulti(index) : setSelectedOption(index))}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 shadow-glass-sm flex items-center justify-between gap-3 ${optionStyle}`}
            >
              <span className="text-sm sm:text-base font-medium text-text-primary pr-2 leading-snug">
                <TranslatedText text={option} />
              </span>
              <div
                className={`w-6 h-6 ${
                  multi ? 'rounded-md' : 'rounded-full'
                } flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isSelected
                    ? 'bg-brand-primary text-white'
                    : isSubmitted && isCorrect
                      ? 'bg-emerald-500 text-white'
                      : isSubmitted && isIncorrectSelection
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-text-primary/50'
                }`}
              >
                {isSubmitted && isCorrect
                  ? '✓'
                  : isSubmitted && isIncorrectSelection
                    ? '✕'
                    : multi && isSelected
                      ? '✓'
                      : String.fromCharCode(65 + index)}
              </div>
            </button>
          )
        })}
      </div>

      {isSubmitted && (
        <div
          className={`p-4 rounded-xl border text-sm leading-relaxed animate-fade-in ${
            hasCorrectAnswer
              ? selectedOption === content.correct_answer
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold'
                : 'bg-red-500/10 border-red-500/20 text-red-400 font-semibold'
              : 'bg-white/5 border-white/10 text-text-primary/75'
          }`}
        >
          {hasCorrectAnswer ? (
            selectedOption === content.correct_answer ? (
              <p>
                ✓ Excellent! That is correct. Deepening this awareness is key to rewiring your habit
                patterns.
              </p>
            ) : (
              <p>
                ✕ Not quite. The recommended response is:{' '}
                <span className="underline">{content.options[content.correct_answer!]}</span>. Take
                a moment to reflect on this perspective as we build support strategies.
              </p>
            )
          ) : (
            <p>
              ✓{' '}
              {readOnly
                ? 'Your saved response for this day.'
                : multi
                  ? 'Noted. We’ll take these apart over the coming days.'
                  : 'Response saved. Self-reflection is a vital step in learning your subconscious smoking cues.'}
            </p>
          )}
        </div>
      )}

      <div className="pt-2">
        <GlassButton
          onClick={handleSubmit}
          disabled={!canContinue || busy}
          fullWidth
          className="py-3.5 sm:py-4 font-bold"
        >
          {busy
            ? 'Saving…'
            : readOnly || isSubmitted
              ? 'Continue'
              : multi
                ? 'Confirm selection'
                : 'Submit Answer'}
        </GlassButton>
      </div>
    </div>
  )
}
