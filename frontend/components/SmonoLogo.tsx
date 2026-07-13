import Mascot from './Mascot'

interface SmonoLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showMascot?: boolean
  layout?: 'inline' | 'stacked'
}

export default function SmonoLogo({
  className = '',
  size = 'md',
  showMascot = false,
  layout = 'stacked',
}: SmonoLogoProps) {
  const mascotSizes = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
    xl: 'lg' as const,
  }

  const imgHeights = {
    sm: 'h-6 sm:h-8',
    md: 'h-8 sm:h-10',
    lg: 'h-12 sm:h-16',
    xl: 'h-16 sm:h-24',
  }

  const logoImage = (
    <img
      src="/smonologo.webp?v=3"
      alt="smono"
      className={`${imgHeights[size]} object-contain select-none`}
    />
  )

  if (!showMascot) {
    return <div className={className}>{logoImage}</div>
  }

  if (layout === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Mascot size={mascotSizes[size]} />
        {logoImage}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Mascot size={mascotSizes[size]} />
      {logoImage}
    </div>
  )
}
