import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Step } from '../../types/models'
import { ExerciseStepContent } from '../../types/models'
import GlassButton from '../GlassButton'
import { Play, Pause, RotateCcw } from 'lucide-react'
import ExerciseWorksheet from './ExerciseWorksheet'
import {
  splitExerciseInstructions,
  formatInstructionBullets,
  formatInstructionParagraphs,
  sanitizeStepText,
  WorksheetPayload,
} from '../../utils/stepContentFormat'

interface ExerciseComponentProps {
  step: Step
  onNext: (response?: unknown) => void | Promise<boolean | void>
  focusLabel?: string
}

export default function ExerciseComponent({ step, onNext, focusLabel }: ExerciseComponentProps) {
  const content = step.content_json as ExerciseStepContent
  const rawInstructions = sanitizeStepText(content.instructions || content.text || '')
  const { body, worksheet } = splitExerciseInstructions(rawInstructions)
  const bullets = formatInstructionBullets(body)
  const paragraphs = formatInstructionParagraphs(body)
  const duration = content.duration_seconds || 0

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isActive, setIsActive] = useState(false)
  const [worksheetData, setWorksheetData] = useState<WorksheetPayload | null>(null)

  const buildPayload = () => ({
    completed: true,
    ...(worksheet && worksheetData ? { worksheet: worksheetData } : {}),
  })

  const finishExercise = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onNext(buildPayload())
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && duration > 0 && !isSubmitting) {
      setIsActive(false)
      void finishExercise()
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, duration, isSubmitting])

  const handleComplete = () => {
    void finishExercise()
  }

  const handleReset = () => {
    setIsActive(false)
    setTimeLeft(duration)
  }

  const breathState =
    duration > 0 && timeLeft > 0 ? (timeLeft % 8 >= 4 ? 'Inhale' : 'Exhale') : ''

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="space-y-5">
      {focusLabel && (
        <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide">{focusLabel}</p>
      )}

      <div className="space-y-3">
        <h3 className="text-lg sm:text-xl font-black text-text-primary leading-snug">
          {content.title || 'Exercise'}
        </h3>

        {paragraphs.map((para, i) => (
          <p key={i} className="text-text-primary/85 leading-relaxed text-sm sm:text-[15px]">
            {para}
          </p>
        ))}

        {bullets.length > 0 && (
          <ul className="space-y-2.5 pl-0.5">
            {bullets.map((item, i) => (
              <li key={i} className="flex gap-2.5 items-start text-sm sm:text-[15px] text-text-primary/90">
                <span className="text-brand-primary font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {!paragraphs.length && !bullets.length && body && (
          <p className="text-text-primary/85 whitespace-pre-line leading-relaxed text-sm sm:text-[15px]">
            {body}
          </p>
        )}
      </div>

      {worksheet && (
        <ExerciseWorksheet format={worksheet} onChange={setWorksheetData} />
      )}

      {duration > 0 && (
        <div className="flex flex-col items-center gap-5 py-4">
          <motion.div
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-brand-primary/20 via-brand-accent/20 to-brand-primary/30 border border-brand-primary/30 flex flex-col items-center justify-center relative shadow-glass-md"
            animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={isActive ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.span
                  key={breathState}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-brand-primary font-black text-sm uppercase tracking-widest absolute"
                >
                  {breathState}
                </motion.span>
              ) : (
                <span className="text-text-primary/60 font-bold text-xs uppercase tracking-wider absolute">
                  Ready
                </span>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="text-center space-y-3">
            <div className="text-2xl font-black text-text-primary">{formatTime(timeLeft)}</div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-text-primary shadow-glass-sm"
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-text-primary/70 hover:text-text-primary shadow-glass-sm"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2.5 pt-2">
        {duration > 0 && (
          <GlassButton
            onClick={handleComplete}
            disabled={isSubmitting}
            className="flex-1 py-3.5 sm:py-4 font-semibold text-text-primary/70 border-white/5 hover:border-white/10 bg-white/5"
          >
            Skip Timer
          </GlassButton>
        )}
        <GlassButton
          onClick={handleComplete}
          disabled={(duration > 0 && timeLeft > 0 && isActive) || isSubmitting}
          className="flex-[2] py-3.5 sm:py-4 font-bold"
        >
          {isSubmitting ? 'Saving…' : 'Mark Complete'}
        </GlassButton>
      </div>
    </div>
  )
}
