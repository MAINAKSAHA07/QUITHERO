import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import GlassCard from './GlassCard'
import { Achievement } from '../types/models'

interface AchievementNotificationProps {
  achievement: Achievement | null
  onClose: () => void
}

export default function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  if (!achievement) return null

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'text-orange-600'
      case 'silver':
        return 'text-gray-400'
      case 'gold':
        return 'text-yellow-500'
      case 'platinum':
        return 'text-purple-500'
      default:
        return 'text-brand-primary'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <GlassCard className="p-6 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 border-2 border-brand-primary/50">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0"
            >
              <Trophy className={`w-8 h-8 ${getTierColor(achievement.tier || 'bronze')}`} />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-text-primary">🎉 Achievement Unlocked!</h3>
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-full glass-subtle flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-text-primary" />
                </button>
              </div>
              <h4 className="text-xl font-semibold text-brand-primary mb-1">{achievement.title}</h4>
              <p className="text-sm text-text-primary/70">{achievement.description}</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  )
}

