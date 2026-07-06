import { useState } from 'react'
import { Step } from '../../types/models'
import { OpenStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import { splitReflectionPrompts, sanitizeStepText } from '../../utils/stepContentFormat'

interface OpenQuestionComponentProps {
  step: Step
  onNext: (response: any) => void
}

const removeEmojis = (text: string): string => {
  if (!text) return text
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2190}-\u{21FF}]/gu, '')
    .replace(/[\u{2300}-\u{23FF}]/gu, '')
    .replace(/[\u{2B50}-\u{2B55}]/gu, '')
    .replace(/[\u{3030}-\u{303F}]/gu, '')
    .replace(/[\u{3299}-\u{3299}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/[\u{20E3}]/gu, '')
    .replace(/[\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function OpenQuestionComponent({ step, onNext }: OpenQuestionComponentProps) {
  const content = step.content_json as OpenStepContent
  const [answer, setAnswer] = useState('')

  const prompts = splitReflectionPrompts(sanitizeStepText(content.question || ''))
  const hasMultiplePrompts = prompts.length > 1

  const handleSubmit = () => {
    if (answer.trim()) {
      onNext({ answer: answer.trim() })
    }
  }

  const stepPlaceholder = content.placeholder?.trim()
  const cleanPlaceholder = removeEmojis(stepPlaceholder || 'Write a few sentences for each prompt above…')

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const mindfulTarget = hasMultiplePrompts ? 15 : 10
  const targetMet = wordCount >= mindfulTarget

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {hasMultiplePrompts ? (
          <>
            <h3 className="text-lg font-bold text-text-primary">Reflection</h3>
            <ol className="space-y-3">
              {prompts.map((prompt, i) => (
                <li key={i} className="flex gap-2.5 items-start text-sm sm:text-[15px] text-text-primary/90">
                  <span className="text-brand-primary font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="leading-relaxed">{prompt}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <h3 className="text-lg font-bold text-text-primary leading-snug">
            {content.question}
          </h3>
        )}
      </div>

      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={cleanPlaceholder}
          className="glass-input w-full min-h-[160px] p-4 pb-10 rounded-xl resize-none leading-relaxed text-sm sm:text-base focus:border-brand-primary/50 transition-colors"
          rows={6}
        />
        <div className="absolute bottom-3 right-4 flex items-center gap-2">
          <span className={`text-[10px] font-bold tracking-wide uppercase ${
            targetMet ? 'text-emerald-400' : 'text-text-primary/45'
          }`}>
            {targetMet ? '✓ Mindful Entry Met' : `${wordCount}/${mindfulTarget} words`}
          </span>
        </div>
      </div>
      <div className="pt-2">
        <GlassButton
          onClick={handleSubmit}
          disabled={!answer.trim()}
          fullWidth
          className="py-3.5 sm:py-4 font-bold"
        >
          Save & Continue
        </GlassButton>
      </div>
    </div>
  )
}
