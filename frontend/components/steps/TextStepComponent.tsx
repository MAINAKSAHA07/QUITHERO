import { Step } from '../../types/models'
import { TextStepContent } from '../../types/models'
import GlassButton from '../GlassButton'

interface TextStepComponentProps {
  step: Step
  onNext: () => void
}

function formatText(text: string) {
  return text.split('\n\n').map((block, i) => {
    const lines = block.split('\n')
    const isBulletList = lines.every(l => l.startsWith('• ') || l.trim() === '')
    if (isBulletList) {
      return (
        <ul key={i} className="space-y-2 pl-1">
          {lines.filter(l => l.startsWith('• ')).map((l, j) => (
            <li key={j} className="flex gap-2 items-start">
              <span className="text-brand-primary mt-1.5 text-[8px]">●</span>
              <span>{l.slice(2)}</span>
            </li>
          ))}
        </ul>
      )
    }
    const isNumbered = lines.length > 1 && lines.every(l => /^\d+[.)]\s/.test(l) || l.trim() === '')
    if (isNumbered) {
      return (
        <ol key={i} className="space-y-2 pl-1 list-none">
          {lines.filter(l => l.trim()).map((l, j) => (
            <li key={j} className="flex gap-3 items-start">
              <span className="text-brand-primary font-semibold min-w-[1.25rem]">{j + 1}.</span>
              <span>{l.replace(/^\d+[.)]\s*/, '')}</span>
            </li>
          ))}
        </ol>
      )
    }
    return <p key={i}>{block}</p>
  })
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
      <div className="space-y-3 sm:space-y-4">
        {content.title && (
          <h3 className="text-lg sm:text-xl font-bold text-text-primary leading-snug">{content.title}</h3>
        )}
        <div className="text-text-primary/90 leading-relaxed space-y-3 sm:space-y-4 text-sm sm:text-[15px]">
          {formatText(content.text || '')}
        </div>
      </div>
      <div className="pt-3 sm:pt-4">
        <GlassButton
          onClick={(e?: React.MouseEvent) => {
            e?.preventDefault()
            e?.stopPropagation()
            onNext()
          }}
          fullWidth
          className="py-3.5 sm:py-4 touch-target"
          type="button"
        >
          Continue
        </GlassButton>
      </div>
    </div>
  )
}

