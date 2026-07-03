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
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-text-primary">
          {content.title || 'Exercise'}
        </h3>
        <p className="text-text-primary/90 whitespace-pre-line leading-relaxed text-[15px]">
          {content.instructions || content.text}
        </p>
      </div>

      {content.duration_seconds && !completed && (
        <motion.div
          className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-white font-bold text-lg">Breathe</span>
        </motion.div>
      )}

      {completed ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2 py-4"
        >
          <CheckCircle className="w-14 h-14 text-success" />
          <span className="text-success font-semibold">Done!</span>
        </motion.div>
      ) : (
        <GlassButton onClick={handleComplete} fullWidth className="py-4">
          Mark Complete
        </GlassButton>
      )}
    </div>
  )
}

