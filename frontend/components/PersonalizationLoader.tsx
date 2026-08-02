import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import Mascot from './Mascot'
import TranslatedText from './TranslatedText'

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
  const reduce = useReducedMotion()
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCompletedSteps((prev) => (prev.includes(i) ? prev : [...prev, i]))
        }, (i + 1) * 700)
      )
    })
    timers.push(setTimeout(() => onCompleteRef.current(), STEPS.length * 700 + 600))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#F4FBFF]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139, 205, 232, 0.45), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(246, 184, 132, 0.28), transparent 50%)',
        }}
        aria-hidden
      />

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative z-10 flex flex-col items-center w-full"
      >
        <div className="mb-6">
          <Mascot size="lg" />
        </div>

        {!reduce && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
            className="w-10 h-10 mb-6 rounded-full border-[3px] border-[#3F8DD2]/20 border-t-[#3F8DD2]"
            aria-hidden
          />
        )}

        <h1 className="text-xl font-bold text-[#0E2538] tracking-[-0.02em] text-center mb-2">
          <TranslatedText text="Building your plan" />
        </h1>
        <p className="text-sm text-[#0E2538]/50 text-center mb-8 max-w-[16rem]">
          <TranslatedText text="Personalizing sessions from everything you just shared." />
        </p>

        <div className="w-full max-w-xs flex flex-col gap-3" role="status" aria-live="polite">
          <AnimatePresence initial={false}>
            {STEPS.map((step, i) => {
              const done = completedSteps.includes(i)
              const active = !done && completedSteps.length === i
              return (
                <motion.div
                  key={step}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30, delay: reduce ? 0 : i * 0.04 }}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 border ${
                    done
                      ? 'bg-white border-[#6EA48F]/25 shadow-[0_4px_16px_rgba(110,164,143,0.08)]'
                      : active
                        ? 'bg-white border-[#3F8DD2]/30'
                        : 'bg-white/50 border-transparent'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done
                        ? 'bg-[#6EA48F] text-white'
                        : active
                          ? 'bg-[#E8F4FC] text-[#3F8DD2]'
                          : 'bg-[#0E2538]/06 text-[#0E2538]/25'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  <span
                    className={`text-sm font-medium leading-snug ${
                      done ? 'text-[#0E2538]' : active ? 'text-[#0E2538]/80' : 'text-[#0E2538]/35'
                    }`}
                  >
                    <TranslatedText text={step} />
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
