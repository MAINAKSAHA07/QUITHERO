interface MascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  pulse?: boolean
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
}

export default function Mascot({ size = 'md', className = '', pulse = false }: MascotProps) {
  return (
    <img
      src="/mascot.png"
      alt=""
      role="presentation"
      className={`object-contain ${sizeClasses[size]} ${pulse ? 'animate-pulse' : ''} ${className}`}
    />
  )
}
