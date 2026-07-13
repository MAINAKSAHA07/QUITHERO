import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Cigarette } from 'lucide-react'
import GlassButton from './GlassButton'
import Mascot from './Mascot'

interface SmokeCheckModalProps {
  open: boolean
  onStillFree: () => void | Promise<void>
  onSmoked: () => void | Promise<void>
  loading?: boolean
}

export default function SmokeCheckModal({
  open,
  onStillFree,
  onSmoked,
  loading = false,
}: SmokeCheckModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-black/[0.06] p-5 sm:p-6 space-y-5"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            role="dialog"
            aria-labelledby="smoke-check-title"
          >
            <div className="flex items-start gap-3">
              <Mascot size="sm" className="w-14 h-14 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide">
                  6-hour check-in
                </p>
                <h2 id="smoke-check-title" className="text-lg font-bold text-text-primary leading-snug mt-1">
                  Since your last check-in, did you smoke?
                </h2>
                <p className="text-sm text-text-primary/65 mt-2 leading-relaxed">
                  Your smoke-free stats only grow when you confirm here — we check in every 6 hours.
                </p>
              </div>
            </div>

            <div className="grid gap-2.5">
              <GlassButton
                onClick={() => void onStillFree()}
                disabled={loading}
                className="w-full py-3.5 font-bold flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {loading ? 'Saving…' : 'No — still smoke-free'}
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={() => void onSmoked()}
                disabled={loading}
                className="w-full py-3.5 font-semibold flex items-center justify-center gap-2 text-text-primary/80"
              >
                <Cigarette className="w-4 h-4" />
                Yes, I smoked
              </GlassButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
