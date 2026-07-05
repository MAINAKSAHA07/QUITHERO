import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import BorderGlow from './ui/BorderGlow'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'strong' | 'subtle'
  gradient?: boolean
  onClick?: () => void
  hover?: boolean
  borderGlow?: boolean
}

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  gradient = false,
  onClick,
  hover = false,
  borderGlow = true,
}: GlassCardProps) {
  const baseClasses = {
    default: 'glass',
    strong: 'glass-strong',
    subtle: 'glass-subtle',
  }

  // Remove padding/shadow from classes when wrapping with BorderGlow to prevent duplicate padding/double borders
  const classes = `${baseClasses[variant]} ${gradient ? 'bg-gradient-to-br from-brand-primary/10 to-brand-accent/10' : ''} ${className} ${onClick ? 'cursor-pointer' : ''}`

  const card = borderGlow ? (
    <BorderGlow
      className={onClick ? 'cursor-pointer' : ''}
      innerClassName={classes}
    >
      {children}
    </BorderGlow>
  ) : (
    <div className={`${classes} flex flex-col`} onClick={onClick}>
      {children}
    </div>
  )

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-full"
      >
        {card}
      </motion.div>
    )
  }

  return card
}


