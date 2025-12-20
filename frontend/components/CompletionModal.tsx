import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Home, ArrowRight } from 'lucide-react'
import GlassButton from './GlassButton'

interface CompletionModalProps {
  isOpen: boolean
  onClose: () => void
  dayNumber: number
  timeSpentMinutes: number
  stepsCompleted: number
  hasNextDay: boolean
  onNextDay?: () => void
}

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <div className="p-8 text-center bg-white rounded-2xl shadow-2xl border border-gray-200">
            {/* Confetti effect simulation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-success to-success/50 flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="w-16 h-16 text-white" />
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2"
            >
              <span>🎉</span>
              <span>Day {dayNumber} Complete!</span>
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <p className="text-gray-900 text-base font-medium leading-relaxed mb-2">
                You just completed day {dayNumber} of trying to be clean.
              </p>
              <p className="text-gray-700 text-base font-medium">
                Keep up the amazing work!
              </p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
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
            </div>

            {/* Buttons */}
            <div className="space-y-3">
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
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

