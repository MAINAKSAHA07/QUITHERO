import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X } from 'lucide-react'

interface WhyWeAskProps {
  explanation: string
}

export default function WhyWeAsk({ explanation }: WhyWeAskProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="inline-block relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-text-primary/50 hover:text-brand-primary transition-colors p-1"
        aria-label="Why we ask this question"
      >
        <Info className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 glass p-3 rounded-xl shadow-xl z-50"
          >
            <div className="flex items-start gap-2">
              <p className="text-xs text-text-primary/80 leading-relaxed flex-1">{explanation}</p>
              <button onClick={() => setOpen(false)} className="text-text-primary/40 flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 glass rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
