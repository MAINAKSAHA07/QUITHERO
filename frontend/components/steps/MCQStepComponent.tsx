import { useState } from 'react'
import { Step } from '../../types/models'
import { MCQStepContent } from '../../types/models'
import GlassButton from '../GlassButton'

interface MCQStepComponentProps {
  step: Step
  onNext: (response: any) => void
  readOnly?: boolean
  initialSelected?: number | null
}

export default function MCQStepComponent({
  step,
  onNext,
  readOnly = false,
  initialSelected = null,
}: MCQStepComponentProps) {
  const content = step.content_json as MCQStepContent
  const [selectedOption, setSelectedOption] = useState<number | null>(
    typeof initialSelected === 'number' ? initialSelected : null
  )
  const [isSubmitted, setIsSubmitted] = useState(
    readOnly && typeof initialSelected === 'number'
  )

  const handleSubmit = () => {
    if (selectedOption === null) return

    if (readOnly) {
      onNext({ selected_option: selectedOption })
      return
    }

    if (!isSubmitted) {
      setIsSubmitted(true)
    } else {
      onNext({ selected_option: selectedOption })
    }
  }

  const hasCorrectAnswer = content.correct_answer !== undefined && content.correct_answer !== null

  return (
    <div className="space-y-6">
      {readOnly && (
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
          Saved answer · read only
        </p>
      )}
      <h3 className="text-lg sm:text-xl font-black text-text-primary leading-snug">
        {content.question}
      </h3>
      <div className="space-y-3">
        {content.options.map((option, index) => {
          const isSelected = selectedOption === index
          const isCorrect = hasCorrectAnswer && content.correct_answer === index
          const isIncorrectSelection = isSelected && hasCorrectAnswer && content.correct_answer !== index

          let optionStyle = 'hover:border-brand-primary/45 border-white/5 bg-white/5'
          if (isSelected) {
            optionStyle = 'border-brand-primary bg-brand-primary/10 shadow-glow'
          }
          if (isSubmitted) {
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
              disabled={isSubmitted || readOnly}
              onClick={() => setSelectedOption(index)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 shadow-glass-sm flex items-center justify-between ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isSelected
                      ? 'bg-brand-primary text-white'
                      : isSubmitted && isCorrect
                      ? 'bg-emerald-500 text-white'
                      : isSubmitted && isIncorrectSelection
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-text-primary/50'
                  }`}
                >
                  {isSubmitted && isCorrect ? '✓' : isSubmitted && isIncorrectSelection ? '✕' : String.fromCharCode(65 + index)}
                </div>
                <span className="text-text-primary text-sm sm:text-base font-semibold">{option}</span>
              </div>
            </button>
          )
        })}
      </div>

      {isSubmitted && (
        <div className={`p-4 rounded-xl border text-sm leading-relaxed animate-fade-in ${
          hasCorrectAnswer
            ? selectedOption === content.correct_answer
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold'
              : 'bg-red-500/10 border-red-500/20 text-red-400 font-semibold'
            : 'bg-white/5 border-white/10 text-text-primary/75'
        }`}>
          {hasCorrectAnswer ? (
            selectedOption === content.correct_answer ? (
              <p>✓ Excellent! That is correct. Deepening this awareness is key to rewiring your habit patterns.</p>
            ) : (
              <p>✕ Not quite. The recommended response is: <span className="underline">{content.options[content.correct_answer!]}</span>. Take a moment to reflect on this perspective as we build support strategies.</p>
            )
          ) : (
            <p>✓ {readOnly ? 'Your saved response for this day.' : 'Response saved. Self-reflection is a vital step in learning your subconscious smoking cues.'}</p>
          )}
        </div>
      )}

      <div className="pt-2">
        <GlassButton
          onClick={handleSubmit}
          disabled={selectedOption === null}
          fullWidth
          className="py-3.5 sm:py-4 font-bold"
        >
          {readOnly || isSubmitted ? 'Continue' : 'Submit Answer'}
        </GlassButton>
      </div>
    </div>
  )
}
