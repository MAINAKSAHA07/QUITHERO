import { motion } from 'framer-motion'
import { Heart, Wind, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import GlassButton from './GlassButton'

interface SlipRecoveryProps {
  daysFree: number
  onDismiss: () => void
}

export default function SlipRecovery({ daysFree, onDismiss }: SlipRecoveryProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6"
      >
        <Heart className="w-10 h-10 text-brand-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-3">
          One cigarette doesn't erase{daysFree > 0 ? ` ${daysFree} days of` : ' your'} progress
        </h1>
        <p className="text-text-primary/70 text-sm max-w-xs mx-auto">
          A slip is data, not failure. You noticed it, you logged it — that's awareness in action.
          Most successful quitters slip once or twice. What matters is what you do next.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-3 mb-8"
      >
        <button
          onClick={() => navigate('/breathing')}
          className="w-full glass p-4 rounded-xl flex items-center gap-4 text-left transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Wind className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Breathing Exercise</p>
            <p className="text-xs text-text-primary/60">2 minutes to reset your nervous system</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/sessions')}
          className="w-full glass p-4 rounded-xl flex items-center gap-4 text-left transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Continue Your Program</p>
            <p className="text-xs text-text-primary/60">Your next session is waiting</p>
          </div>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <GlassButton variant="secondary" onClick={onDismiss} className="px-8 py-3">
          Back to Home
        </GlassButton>
      </motion.div>
    </div>
  )
}
