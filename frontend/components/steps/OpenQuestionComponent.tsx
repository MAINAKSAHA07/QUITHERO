import { useState } from 'react'
import { Step } from '../../types/models'
import { OpenStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import HandwrittenJournal from '../HandwrittenJournal'
import { splitReflectionPrompts, sanitizeStepText } from '../../utils/stepContentFormat'
import { useLiveTranslation } from '../../hooks/useTranslation'
import TranslatedText from '../TranslatedText'

export type ReflectionAnswer = { prompt: string; answer: string }

export type ReflectionResponse = {
  answers: ReflectionAnswer[]
}

interface OpenQuestionComponentProps {
  step: Step
  onNext: (response: ReflectionResponse) => void | Promise<boolean | void>
  onSavePartial?: (response: ReflectionResponse) => void | Promise<boolean | void>
  /** Completed day revisit — show saved text, do not edit */
  readOnly?: boolean
  initialResponse?: ReflectionResponse | null
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

function reviewAnswersFrom(
  initial: ReflectionResponse | null | undefined,
  prompts: string[],
  fallbackQuestion: string
): ReflectionAnswer[] {
  const fromSaved = initial?.answers?.filter((a) => a?.answer?.trim()) || []
  if (fromSaved.length) return fromSaved
  if (prompts.length) {
    return prompts.map((prompt) => ({ prompt, answer: '' }))
  }
  return [{ prompt: fallbackQuestion, answer: '' }]
}

export default function OpenQuestionComponent({
  step,
  onNext,
  onSavePartial,
  readOnly = false,
  initialResponse = null,
}: OpenQuestionComponentProps) {
  const content = step.content_json as OpenStepContent
  const prompts = splitReflectionPrompts(sanitizeStepText(content.question || ''))
  const totalLive = Math.max(prompts.length, 1)

  const reviewList = reviewAnswersFrom(initialResponse, prompts, content.question || '')
  const [promptIndex, setPromptIndex] = useState(0)
  const [savedAnswers, setSavedAnswers] = useState<ReflectionAnswer[]>([])
  const [answer, setAnswer] = useState(() =>
    readOnly ? reviewList[0]?.answer || '' : ''
  )
  const [isSaving, setIsSaving] = useState(false)

  const reviewTotal = Math.max(reviewList.length, 1)
  const total = readOnly ? reviewTotal : totalLive
  const currentPrompt = readOnly
    ? reviewList[promptIndex]?.prompt || prompts[promptIndex] || content.question || ''
    : prompts[promptIndex] || content.question || ''
  const translatedPrompt = useLiveTranslation(currentPrompt)
  const isLastPrompt = promptIndex >= total - 1

  const stepPlaceholder = content.placeholder?.trim()
  const cleanPlaceholderEn = removeEmojis(
    stepPlaceholder || 'Write a few sentences in your own words…'
  )
  const cleanPlaceholder = useLiveTranslation(cleanPlaceholderEn)

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const mindfulTarget = 10
  const targetMet = wordCount >= mindfulTarget

  const handleSubmit = async () => {
    if (readOnly) {
      if (isLastPrompt) {
        await onNext({ answers: reviewList })
        return
      }
      const next = promptIndex + 1
      setPromptIndex(next)
      setAnswer(reviewList[next]?.answer || '')
      return
    }

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
      {readOnly && (
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
          Saved reflection · read only
        </p>
      )}
      {total > 1 && (
        <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
          Reflection {promptIndex + 1} of {total}
        </p>
      )}

      <HandwrittenJournal
        value={answer}
        onChange={readOnly ? () => {} : setAnswer}
        prompt={translatedPrompt}
        placeholder={readOnly ? '' : cleanPlaceholder}
        minRows={7}
        textareaProps={readOnly ? { readOnly: true } : undefined}
        footer={
          readOnly ? (
            <span className="text-[10px] font-bold tracking-wide uppercase text-emerald-600">
              Saved
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold tracking-wide uppercase ${
                targetMet ? 'text-emerald-600' : 'text-text-primary/45'
              }`}
            >
              {targetMet ? '✓ Mindful Entry Met' : `${wordCount}/${mindfulTarget} words`}
            </span>
          )
        }
      />

      <div className="pt-1">
        <GlassButton
          onClick={() => void handleSubmit()}
          disabled={(!readOnly && !answer.trim()) || isSaving}
          fullWidth
          className="py-3.5 sm:py-4 font-bold"
        >
          {isSaving ? (
            <TranslatedText text="Saving…" />
          ) : readOnly ? (
            isLastPrompt ? (
              <TranslatedText text="Continue" />
            ) : (
              <TranslatedText text="Next" />
            )
          ) : isLastPrompt ? (
            <TranslatedText text="Save & Continue" />
          ) : (
            <TranslatedText text="Next Question" />
          )}
        </GlassButton>
      </div>
    </div>
  )
}
