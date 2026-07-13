import { useState } from 'react'
import { Step } from '../../types/models'
import { OpenStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import { splitReflectionPrompts, sanitizeStepText } from '../../utils/stepContentFormat'

export type ReflectionAnswer = { prompt: string; answer: string }

export type ReflectionResponse = {
  answers: ReflectionAnswer[]
}

interface OpenQuestionComponentProps {
  step: Step
  onNext: (response: ReflectionResponse) => void | Promise<boolean | void>
  onSavePartial?: (response: ReflectionResponse) => void | Promise<boolean | void>
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

export default function OpenQuestionComponent({ step, onNext, onSavePartial }: OpenQuestionComponentProps) {
  const content = step.content_json as OpenStepContent
  const prompts = splitReflectionPrompts(sanitizeStepText(content.question || ''))
  const total = Math.max(prompts.length, 1)
  const [promptIndex, setPromptIndex] = useState(0)
  const [savedAnswers, setSavedAnswers] = useState<ReflectionAnswer[]>([])
  const [answer, setAnswer] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const currentPrompt = prompts[promptIndex] || content.question || ''
  const isLastPrompt = promptIndex >= total - 1

  const stepPlaceholder = content.placeholder?.trim()
  const cleanPlaceholder = removeEmojis(
    stepPlaceholder || 'Write a few sentences in your own words…'
  )

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const mindfulTarget = 10
  const targetMet = wordCount >= mindfulTarget

  const handleSubmit = async () => {
    const trimmed = answer.trim()
    if (!trimmed || isSaving) return

    const entry: ReflectionAnswer = { prompt: currentPrompt, answer: trimmed }
    const nextAnswers = [...savedAnswers, entry]
    setIsSaving(true)
    try {
      if (isLastPrompt) {
        await onNext({ answers: nextAnswers })
        return
      }

      if (onSavePartial) {
        await onSavePartial({ answers: nextAnswers })
      }
      setSavedAnswers(nextAnswers)
      setPromptIndex((i) => i + 1)
      setAnswer('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {total > 1 && (
          <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
            Reflection {promptIndex + 1} of {total}
          </p>
        )}
        <h3 className="text-lg font-bold text-text-primary leading-snug">{currentPrompt}</h3>
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
          <span
            className={`text-[10px] font-bold tracking-wide uppercase ${
              targetMet ? 'text-emerald-400' : 'text-text-primary/45'
            }`}
          >
            {targetMet ? '✓ Mindful Entry Met' : `${wordCount}/${mindfulTarget} words`}
          </span>
        </div>
      </div>
      <div className="pt-2">
        <GlassButton
          onClick={() => void handleSubmit()}
          disabled={!answer.trim() || isSaving}
          fullWidth
          className="py-3.5 sm:py-4 font-bold"
        >
          {isSaving ? 'Saving…' : isLastPrompt ? 'Save & Continue' : 'Next Question'}
        </GlassButton>
      </div>
    </div>
  )
}
