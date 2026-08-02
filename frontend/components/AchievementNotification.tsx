import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import { Achievement } from '../types/models'
import { useMotionPrefs } from '../hooks/useMotionPrefs'
import { haptic, hapticPatterns } from '../utils/haptic'

interface AchievementNotificationProps {
  achievement: Achievement | null
  onClose: () => void
}

function tierAccent(tier?: string) {
  switch (tier) {
    case 'bronze':
      return { icon: 'text-[#C46A2E]', ring: 'bg-[#FFF1E6]', bar: 'bg-[#F6B884]' }
    case 'silver':
      return { icon: 'text-[#6B7C8A]', ring: 'bg-[#EEF2F5]', bar: 'bg-[#A8B4BE]' }
    case 'gold':
      return { icon: 'text-[#C9A227]', ring: 'bg-[#FFF8E6]', bar: 'bg-[#E8C547]' }
    case 'platinum':
      return { icon: 'text-[#5B6B9B]', ring: 'bg-[#F0F2FA]', bar: 'bg-[#8B9BC8]' }
    default:
      return { icon: 'text-[#3F8DD2]', ring: 'bg-[#E8F4FC]', bar: 'bg-[#3F8DD2]' }
  }
}

/**
 * Achievement toast — banner from the top (notification spatial path).
 * Springs, press feedback, haptic, single frosted material (Apple-style).
 */
export default function AchievementNotification({
  achievement,
  onClose,
}: AchievementNotificationProps) {
  const { reduce, springUi } = useMotionPrefs()
  const accent = tierAccent(achievement?.tier)

  useEffect(() => {
    if (!achievement) return
    haptic(hapticPatterns.achievement)
  }, [achievement?.id, achievement?.key])

  return (
    <AnimatePresence>
      {achievement ? (
        <motion.div
          key={achievement.id || achievement.key || achievement.title}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -28 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -28 }}
          transition={
            reduce
              ? { duration: 0.18 }
              : { type: 'spring', stiffness: 420, damping: 32, mass: 0.85 }
          }
          className="fixed top-0 inset-x-0 z-[60] safe-area-top pointer-events-none"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-md px-4 pt-3">
            <motion.div
              layout={false}
              className="relative overflow-hidden rounded-[20px] border border-white/70 bg-white/72 shadow-[0_12px_40px_rgba(14,37,56,0.14)] backdrop-blur-[20px] backdrop-saturate-[180%]"
              style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
            >
              {/* Light catch on top edge — material, not a second translucent stack */}
              <div
                className={`absolute inset-x-0 top-0 h-0.5 ${accent.bar}`}
                aria-hidden
              />

              <div className="flex items-start gap-3.5 p-4 pr-3">
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  transition={springUi}
                  className={`w-12 h-12 rounded-full ${accent.ring} flex items-center justify-center flex-shrink-0`}
                >
                  <Trophy className={`w-6 h-6 ${accent.icon}`} strokeWidth={2.25} />
                </motion.div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[#0E2538]/45 mb-0.5">
                    Achievement unlocked
                  </p>
                  <h3 className="text-[17px] font-bold text-[#0E2538] leading-snug tracking-[-0.01em]">
                    {achievement.title}
                  </h3>
                  {achievement.description ? (
                    <p className="text-[13px] text-[#0E2538]/55 leading-snug mt-1 line-clamp-2">
                      {achievement.description}
                    </p>
                  ) : null}
                </div>

                <motion.button
                  type="button"
                  aria-label="Dismiss"
                  onClick={onClose}
                  whileTap={reduce ? undefined : { scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-8 h-8 rounded-full bg-[#0E2538]/06 flex items-center justify-center flex-shrink-0 active:bg-[#0E2538]/10"
                >
                  <X className="w-4 h-4 text-[#0E2538]/55" strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
