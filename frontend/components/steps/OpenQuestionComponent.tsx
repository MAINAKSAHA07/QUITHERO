import { useState } from 'react'
import { Step } from '../../types/models'
import { OpenStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import GlassInput from '../GlassInput'

interface OpenQuestionComponentProps {
  step: Step
  onNext: (response: any) => void
}

export default function OpenQuestionComponent({ step, onNext }: OpenQuestionComponentProps) {
  const content = step.content_json as OpenStepContent
  const [answer, setAnswer] = useState('')

  const handleSubmit = () => {
    if (answer.trim()) {
      onNext({ answer: answer.trim() })
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">
        {content.question}
      </h3>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={content.placeholder || 'Type your answer here...'}
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

