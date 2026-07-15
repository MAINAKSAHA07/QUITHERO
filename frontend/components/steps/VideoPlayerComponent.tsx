import { useState } from 'react'
import { Step } from '../../types/models'
import { VideoStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import { Play } from 'lucide-react'
import { isEmbedVideoUrl, resolveMediaUrl } from '../../utils/mediaUrl'

interface VideoPlayerComponentProps {
  step: Step
  onNext: () => void
}

export default function VideoPlayerComponent({ step, onNext }: VideoPlayerComponentProps) {
  const content = step.content_json as VideoStepContent
  const [watched, setWatched] = useState(false)
  const videoUrl = resolveMediaUrl(content.video_url)

  return (
    <div className="space-y-4">
      {content.title && (
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {content.title}
        </h3>
      )}
      {content.description && (
        <p className="text-text-primary/70 mb-4">{content.description}</p>
      )}
      <div className="aspect-video glass rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
        {videoUrl ? (
          isEmbedVideoUrl(videoUrl) ? (
            <iframe
              src={videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setWatched(true)}
            />
          ) : (
            <video
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              controls
              playsInline
              onLoadedData={() => setWatched(true)}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Play className="w-16 h-16 text-brand-primary mb-2" />
            <p className="text-text-primary/70">Video Player</p>
          </div>
        )}
      </div>
      <GlassButton
        onClick={onNext}
        disabled={!watched && !videoUrl}
        fullWidth
        className="py-4"
      >
        Continue
      </GlassButton>
    </div>
  )
}

