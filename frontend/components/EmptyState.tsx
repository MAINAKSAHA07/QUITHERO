import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import GlassButton from './GlassButton'

interface EmptyStateProps {
  icon: LucideIcon | string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-4"
    >
      {typeof Icon === 'string' ? (
        <div className="text-6xl mb-4">{Icon}</div>
      ) : (
        <Icon className="w-16 h-16 text-text-primary/30 mx-auto mb-4" />
      )}
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-primary/70 mb-6 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <GlassButton onClick={onAction} className="py-3">
          {actionLabel}
        </GlassButton>
      )}
    </motion.div>
  )
}

