import { useState } from 'react'
import { motion } from 'framer-motion'
import { Step } from '../../types/models'
import { ExerciseStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import { CheckCircle } from 'lucide-react'

interface ExerciseComponentProps {
  step: Step
  onNext: () => void
}

export default function ExerciseComponent({ step, onNext }: ExerciseComponentProps) {
  const content = step.content_json as ExerciseStepContent
  const [completed, setCompleted] = useState(false)

  const handleComplete = () => {
    setCompleted(true)
    setTimeout(onNext, 1200)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2 sm:space-y-3">
        <h3 className="text-lg sm:text-xl font-bold text-text-primary">
          {content.title || 'Exercise'}
        </h3>
        <p className="text-text-primary/90 whitespace-pre-line leading-relaxed text-sm sm:text-[15px]">
          {content.instructions || content.text}
        </p>
      </div>

      {content.duration_seconds && !completed && (
        <motion.div
          className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-white font-bold text-base sm:text-lg">Breathe</span>
        </motion.div>
      )}

      {completed ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2 py-4"
        >
          <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-success" />
          <span className="text-success font-semibold">Done!</span>
        </motion.div>
      ) : (
        <GlassButton onClick={handleComplete} fullWidth className="py-3.5 sm:py-4 touch-target">
          Mark Complete
        </GlassButton>
      )}
    </div>
  )
}

