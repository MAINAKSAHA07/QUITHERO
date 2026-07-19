import { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
  const reduce = useReducedMotion()
  const baseClasses = {
    default: 'glass',
    strong: 'glass-strong',
    subtle: 'glass-subtle',
  }

  const classes = `${baseClasses[variant]} ${gradient ? 'bg-gradient-to-br from-brand-primary/10 to-brand-accent/10' : ''} ${className} ${onClick ? 'cursor-pointer' : ''}`

  const card = borderGlow ? (
    <BorderGlow
      className={onClick ? 'cursor-pointer' : ''}
      innerClassName={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {children}
    </BorderGlow>
  ) : (
    <div className={`${classes} flex flex-col`} onClick={onClick}>
      {children}
    </div>
  )

  if (hover && !reduce) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="w-full h-full transition-transform duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1"
      >
        {card}
      </motion.div>
    )
  }

  return card
}
