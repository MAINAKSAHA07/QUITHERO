import { motion, AnimatePresence } from 'framer-motion'
import GlassButton from './GlassButton'
import Mascot from './Mascot'
import SmonoLogo from './SmonoLogo'
import { haptic, hapticPatterns } from '../utils/haptic'

interface MilestoneModalProps {
  isOpen: boolean
  days: number
  onClose: () => void
}

const milestoneMessages: Record<number, { title: string; subtitle: string }> = {
  3: { title: '3 Days Strong!', subtitle: 'Your body is already clearing nicotine. CO levels are back to normal.' },
  7: { title: 'One Week Free!', subtitle: 'Nerve endings are regenerating. Taste and smell are coming back.' },
  14: { title: 'Two Weeks!', subtitle: 'Circulation is improving. Walking is getting easier.' },
  30: { title: 'One Month Free!', subtitle: 'Lung function is increasing. Cilia are regrowing. You did it.' },
}

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 300 - 150,
  y: -(Math.random() * 400 + 100),
  rotate: Math.random() * 720 - 360,
  scale: Math.random() * 0.6 + 0.4,
  delay: Math.random() * 0.5,
}))

export default function MilestoneModal({ isOpen, days, onClose }: MilestoneModalProps) {
  const milestone = milestoneMessages[days] || { title: `${days} Days!`, subtitle: 'Every day counts. Keep going.' }

  if (isOpen) haptic(hapticPatterns.achievement)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="milestone-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative bg-white border border-gray-100 shadow-2xl p-8 rounded-3xl text-center max-w-sm w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Confetti particles */}
            {particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotate }}
                transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 w-3 h-3 rounded-sm"
                style={{ backgroundColor: ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'][p.id % 5] }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-4 flex flex-col items-center gap-2"
            >
              <Mascot size="lg" />
              <SmonoLogo size="sm" />
            </motion.div>

            <motion.h1
              id="milestone-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-text-primary mb-2"
            >
              {milestone.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-text-primary/70 text-sm mb-6"
            >
              {milestone.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center"
            >
              <GlassButton onClick={onClose} className="px-8 py-3">
                Keep Going!
              </GlassButton>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
