import { useState } from 'react'
import { Step } from '../../types/models'
import { OpenStepContent } from '../../types/models'
import GlassButton from '../GlassButton'

interface OpenQuestionComponentProps {
  step: Step
  onNext: (response: any) => void
}

// Remove emojis from text - comprehensive regex pattern
const removeEmojis = (text: string): string => {
  if (!text) return text
  // Comprehensive emoji removal regex covering all Unicode emoji ranges
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Miscellaneous Symbols and Pictographs
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous Symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{2190}-\u{21FF}]/gu, '') // Arrows
    .replace(/[\u{2300}-\u{23FF}]/gu, '') // Miscellaneous Technical
    .replace(/[\u{2B50}-\u{2B55}]/gu, '') // Stars and other symbols
    .replace(/[\u{3030}-\u{303F}]/gu, '') // CJK Symbols and Punctuation
    .replace(/[\u{3299}-\u{3299}]/gu, '') // Circled ideograph
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
    .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
    .replace(/[\u{20E3}]/gu, '') // Combining Enclosing Keycap
    .replace(/[\u{FE0F}]/gu, '') // Variation Selector-16
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim()
}

export default function OpenQuestionComponent({ step, onNext }: OpenQuestionComponentProps) {
  const content = step.content_json as OpenStepContent
  const [answer, setAnswer] = useState('')

  const handleSubmit = () => {
    if (answer.trim()) {
      onNext({ answer: answer.trim() })
    }
  }

  // Clean placeholder text to remove emojis
  const cleanPlaceholder = removeEmojis(content.placeholder || 'Type your answer here...') || 'Type your answer here...'

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">
        {content.question}
      </h3>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={cleanPlaceholder}
        className="glass-input w-full min-h-[120px] p-4 rounded-xl resize-none"
        rows={5}
      />
      <div className="pt-2">
        <GlassButton
          onClick={handleSubmit}
          disabled={!answer.trim()}
          fullWidth
          className="py-4"
        >
          Save & Continue
        </GlassButton>
      </div>
    </div>
  )
}

