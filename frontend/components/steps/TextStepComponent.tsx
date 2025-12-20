import { Step } from '../../types/models'
import { TextStepContent } from '../../types/models'
import GlassButton from '../GlassButton'

interface TextStepComponentProps {
  step: Step
  onNext: () => void
}

export default function TextStepComponent({ step, onNext }: TextStepComponentProps) {
  const content = step.content_json as TextStepContent

  return (
    <div className="space-y-6">
      {content.image_url && (
        <img
          src={content.image_url}
          alt="Step illustration"
          className="w-full rounded-xl"
        />
      )}
      {content.video_url && (
        <div className="aspect-video glass rounded-xl overflow-hidden">
          <iframe
            src={content.video_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <div className="text-text-primary/90 whitespace-pre-line leading-relaxed">
        {content.text}
      </div>
      <div className="pt-2">
        <GlassButton
          onClick={(e?: React.MouseEvent) => {
            e?.preventDefault()
            e?.stopPropagation()
            onNext()
          }}
          fullWidth
          className="py-4"
          type="button"
        >
          Continue
        </GlassButton>
      </div>
    </div>
  )
}

