import { motion } from 'framer-motion'
import GlassCard from './GlassCard'
import { SessionStatCardData } from '../utils/sessionPersonalization'

interface SessionStatCardProps {
  stat: SessionStatCardData
}

export default function SessionStatCard({ stat }: SessionStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <GlassCard className="p-5 mb-4 bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 border-brand-primary/15">
        <div className="flex items-start gap-4">
          <span className="text-3xl" aria-hidden>{stat.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80 mb-1">
              Your number
            </p>
            <p className="text-sm text-text-primary/70 mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-primary/60 mt-2 leading-relaxed">{stat.subtext}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
