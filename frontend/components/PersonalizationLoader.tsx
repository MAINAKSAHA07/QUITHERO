import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PersonalizationLoaderProps {
  onComplete: () => void
}

const STEPS = [
  'Analyzing your smoking patterns...',
  'Building your personalized program...',
  'Setting up CBT exercises...',
  'Preparing your daily content...',
]

export const PersonalizationLoader: React.FC<PersonalizationLoaderProps> = ({ onComplete }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, i])
        }, (i + 1) * 500)
      )
    })
    timers.push(setTimeout(onComplete, 2500))
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 gap-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full shadow-glow"
      />

      <h2 className="text-lg font-bold text-text-primary">
        Personalizing your experience
      </h2>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <AnimatePresence>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold
                  ${completedSteps.includes(i) ? 'bg-brand-primary text-white shadow-glow' : 'bg-white/5 text-text-primary/30 border border-white/5'}`}
              >
                {completedSteps.includes(i) ? '✓' : '·'}
              </div>
              <span
                className={`text-sm font-medium ${
                  completedSteps.includes(i) ? 'text-text-primary' : 'text-text-primary/40'
                }`}
              >
                {step}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
