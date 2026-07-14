import { Step } from '../../types/models'
import { TextStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import { sanitizeStepText } from '../../utils/stepContentFormat'
import { isEmbedVideoUrl } from '../../utils/mediaUrl'

interface TextStepComponentProps {
  step: Step
  onNext: () => void
}

function formatRichText(text: string) {
  // Simple bold/italic markdown parser
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-black text-brand-primary">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic text-brand-accent">{part.slice(1, -1)}</em>
    }
    return part
  })
}

function formatText(text: string) {
  return text.split('\n\n').map((block, i) => {
    const trimmedBlock = block.trim()
    if (trimmedBlock.startsWith('> ')) {
      return (
        <div key={i} className="p-4 rounded-xl border-l-4 border-brand-primary bg-brand-primary/5 my-3 shadow-glass-sm italic text-text-primary/95 text-[14px] sm:text-[15px] leading-relaxed">
          {formatRichText(trimmedBlock.slice(2))}
        </div>
      )
    }

    const lines = trimmedBlock.split('\n')
    const isBulletList = lines.every(l => l.startsWith('• ') || l.trim() === '')
    if (isBulletList) {
      return (
        <ul key={i} className="space-y-2 pl-1">
          {lines.filter(l => l.startsWith('• ')).map((l, j) => (
            <li key={j} className="flex gap-2 items-start text-sm sm:text-[15px] text-text-primary/90">
              <span className="text-brand-primary mt-2 text-[8px] flex-shrink-0">●</span>
              <span>{formatRichText(l.slice(2))}</span>
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
            <li key={j} className="flex gap-3 items-start text-sm sm:text-[15px] text-text-primary/90">
              <span className="text-brand-primary font-bold min-w-[1.25rem] flex-shrink-0">{j + 1}.</span>
              <span>{formatRichText(l.replace(/^\d+[.)]\s*/, ''))}</span>
            </li>
          ))}
        </ol>
      )
    }

    return <p key={i} className="text-text-primary/90 leading-relaxed text-sm sm:text-[15px]">{formatRichText(trimmedBlock)}</p>
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
          {isEmbedVideoUrl(content.video_url) ? (
            <iframe
              src={content.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={content.video_url}
              className="w-full h-full object-contain bg-black"
              controls
              playsInline
            />
          )}
        </div>
      )}
      <div className="space-y-3 sm:space-y-4">
        {content.title && (
          <h3 className="text-lg sm:text-xl font-bold text-text-primary leading-snug">{content.title}</h3>
        )}
        <div className="text-text-primary/90 leading-relaxed space-y-3 sm:space-y-4 text-sm sm:text-[15px]">
          {formatText(sanitizeStepText(content.text || ''))}
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

