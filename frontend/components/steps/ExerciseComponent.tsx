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
    setTimeout(() => {
      onNext()
    }, 1000)
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Exercise
        </h3>
        <p className="text-text-primary/90 whitespace-pre-line leading-relaxed">
          {content.instructions}
        </p>
      </div>

      {content.duration_seconds && (
        <motion.div
          className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-info to-info/50 flex items-center justify-center"
          animate={{
            scale: completed ? [1, 1.2, 1] : [1, 1.1, 1],
          }}
          transition={{
            duration: content.duration_seconds || 5,
            repeat: completed ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        >
          {completed ? (
            <CheckCircle className="w-16 h-16 text-white" />
          ) : (
            <span className="text-white font-bold text-xl">Breathe</span>
          )}
        </motion.div>
      )}

      {!completed && (
        <GlassButton onClick={handleComplete} fullWidth className="py-4">
          Mark Complete
        </GlassButton>
      )}
    </div>
  )
}

