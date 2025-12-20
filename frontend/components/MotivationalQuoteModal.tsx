import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'

interface MotivationalQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  quote: {
    text: string
    details?: string
  }
}

export default function MotivationalQuoteModal({ isOpen, onClose, quote }: MotivationalQuoteModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <div className="p-8 text-center relative bg-white rounded-2xl shadow-2xl border border-gray-200">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-6"
            >
              <Sparkles className="w-16 h-16 text-brand-primary mx-auto" />
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {quote.text}
            </h3>
            {quote.details && (
              <p className="text-gray-700 text-lg whitespace-pre-line">
                {quote.details}
              </p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
              >
                Got it, thanks!
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

