import { useState } from 'react'
import { Step } from '../../types/models'
import { MCQStepContent } from '../../types/models'
import GlassButton from '../GlassButton'

interface MCQStepComponentProps {
  step: Step
  onNext: (response: any) => void
}

export default function MCQStepComponent({ step, onNext }: MCQStepComponentProps) {
  const content = step.content_json as MCQStepContent
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleSubmit = () => {
    if (selectedOption !== null) {
      onNext({ selected_option: selectedOption })
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">
        {content.question}
      </h3>
      <div className="space-y-3">
        {content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedOption(index)}
            className={`w-full glass p-4 rounded-xl text-left transition-all ${
              selectedOption === index
                ? 'ring-2 ring-brand-primary shadow-glow bg-brand-primary/10'
                : 'hover:ring-2 hover:ring-brand-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selectedOption === index
                    ? 'bg-brand-primary text-white'
                    : 'bg-text-primary/10 text-text-primary/50'
                }`}
              >
                {selectedOption === index ? '✓' : String.fromCharCode(65 + index)}
              </div>
              <span className="text-text-primary">{option}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="pt-2">
        <GlassButton
          onClick={handleSubmit}
          disabled={selectedOption === null}
          fullWidth
          className="py-4"
        >
          Submit
        </GlassButton>
      </div>
    </div>
  )
}

