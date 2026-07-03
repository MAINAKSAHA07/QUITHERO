import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Home, ArrowRight } from 'lucide-react'
import GlassButton from './GlassButton'
import { haptic, hapticPatterns } from '../utils/haptic'

interface CompletionModalProps {
  isOpen: boolean
  onClose: () => void
  dayNumber: number
  timeSpentMinutes: number
  stepsCompleted: number
  hasNextDay: boolean
  onNextDay?: () => void
}

const confetti = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 320 - 160,
  y: -(Math.random() * 500 + 80),
  rotate: Math.random() * 720 - 360,
  scale: Math.random() * 0.8 + 0.3,
  delay: Math.random() * 0.4,
  color: ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'][i % 6],
}))

export default function CompletionModal({
  isOpen,
  onClose,
  dayNumber,
  timeSpentMinutes,
  stepsCompleted,
  hasNextDay,
  onNextDay,
}: CompletionModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  haptic(hapticPatterns.success)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-title"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md relative overflow-hidden"
        >
          <div className="p-8 text-center bg-white rounded-2xl shadow-2xl border border-gray-200 relative">
            {/* Confetti particles */}
            {confetti.map(p => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotate }}
                transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/3 w-2 h-2 rounded-sm pointer-events-none"
                style={{ backgroundColor: p.color }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-success to-success/50 flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="w-16 h-16 text-white" />
            </motion.div>

            <motion.h2
              id="completion-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-gray-900 mb-2"
            >
              Day {dayNumber} Complete!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-brand-primary font-semibold text-lg mb-4"
            >
              {dayNumber} day streak!
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-sm mb-6"
            >
              {dayNumber < 30
                ? `${30 - dayNumber} days to go. You're building something real.`
                : 'You completed the entire program. Incredible.'}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-3xl font-bold text-brand-primary mb-1">
                  {timeSpentMinutes}
                </div>
                <div className="text-sm text-gray-700 font-medium">Minutes</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-3xl font-bold text-brand-primary mb-1">
                  {stepsCompleted}
                </div>
                <div className="text-sm text-gray-700 font-medium">Steps</div>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {hasNextDay && onNextDay && (
                <GlassButton
                  onClick={onNextDay}
                  fullWidth
                  className="py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    Next Day <ArrowRight className="w-5 h-5" />
                  </span>
                </GlassButton>
              )}
              <button
                onClick={() => {
                  navigate('/home')
                  onClose()
                }}
                className="w-full py-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> Back to Home
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
