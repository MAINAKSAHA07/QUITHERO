import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X } from 'lucide-react'
import GlassCard from './GlassCard'

interface SuccessToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function SuccessToast({
  message,
  isVisible,
  onClose,
  duration = 3000,
}: SuccessToastProps) {
  if (!isVisible) return null

  // Auto-close after duration
  setTimeout(() => {
    onClose()
  }, duration)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <GlassCard className="p-4 bg-success/20 border-2 border-success/50">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
            <p className="text-text-primary flex-1">{message}</p>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full glass-subtle flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4 text-text-primary" />
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  )
}

