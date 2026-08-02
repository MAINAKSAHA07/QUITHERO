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
    // Tight-cropped wordmark — these heights are real letter heights (Apple optical scale).
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-28',
  }

  const logoImage = (
    <img
      src="/smonologo.webp?v=5"
      alt="smono"
      className={`${imgHeights[size]} w-auto object-contain select-none transition-transform duration-100 ease-out active:scale-[0.97]`}
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
