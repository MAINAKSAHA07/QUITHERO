import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassButtonProps {
  children: ReactNode
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  variant?: 'primary' | 'secondary' | 'tertiary'
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export default function GlassButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button',
}: GlassButtonProps) {
  const baseClasses = {
    primary: 'glass-button-primary',
    secondary: 'glass-button-secondary',
    tertiary: 'text-brand-primary hover:underline font-medium',
  }

  const classes = `${baseClasses[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`

  return (
    <motion.button
      type={type}
      className={`${classes} flex items-center justify-center`}
      onClick={(e) => {
        // Don't prevent default for submit buttons - let form submission work
        if (type !== 'submit') {
          e.preventDefault()
          e.stopPropagation()
        }
        onClick?.(e)
      }}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  )
}

