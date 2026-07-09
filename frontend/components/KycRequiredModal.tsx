import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import GlassButton from './GlassButton'
import Mascot from './Mascot'
import TranslatedText from './TranslatedText'

interface KycRequiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function KycRequiredModal({ isOpen, onClose }: KycRequiredModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-required-title"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-sky-200/40 p-6 text-center"
        >
          <div className="flex justify-center mb-4">
            <Mascot size="md" />
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 id="kyc-required-title" className="text-lg font-bold text-text-primary mb-2">
            <TranslatedText text="Complete your profile first" />
          </h2>
          <p className="text-sm text-text-primary/65 mb-6 leading-relaxed">
            <TranslatedText text="A quick setup helps us personalize your sessions. Finish it before starting the program." />
          </p>
          <div className="flex flex-col gap-2">
            <GlassButton
              fullWidth
              className="py-3 font-bold"
              onClick={() => {
                onClose()
                navigate('/kyc')
              }}
            >
              <TranslatedText text="Complete setup" />
            </GlassButton>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 text-sm font-medium text-text-primary/50 hover:text-text-primary/70 transition-colors"
            >
              <TranslatedText text="Not now" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
