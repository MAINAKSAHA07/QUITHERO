import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'strong' | 'subtle'
  gradient?: boolean
  onClick?: () => void
  hover?: boolean
}

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  gradient = false,
  onClick,
  hover = false,
}: GlassCardProps) {
  const baseClasses = {
    default: 'glass',
    strong: 'glass-strong',
    subtle: 'glass-subtle',
  }

  const classes = `${baseClasses[variant]} ${gradient ? 'bg-gradient-to-br from-brand-primary/10 to-brand-accent/10' : ''} ${className} ${onClick ? 'cursor-pointer' : ''}`

  const card = (
    <div className={`${classes} flex flex-col`} onClick={onClick}>
      {children}
    </div>
  )

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
      >
        {card}
      </motion.div>
    )
  }

  return card
}

