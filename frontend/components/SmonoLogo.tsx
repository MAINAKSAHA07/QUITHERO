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
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }

  const oSizes = {
    sm: { width: '1.25rem', height: '1.25rem' },
    md: { width: '1.45rem', height: '1.45rem' },
    lg: { width: '2.2rem', height: '2.2rem' },
    xl: { width: '3.4rem', height: '3.4rem' },
  }

  const mascotSizes = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
    xl: 'lg' as const,
  }

  const currentO = oSizes[size]

  const wordmark = (
    <div className={`flex items-center font-black select-none tracking-tight leading-none ${sizeClasses[size]}`}>
      <span className="text-[#A8D4EA] flex items-center">
        <span>sm</span>
        <svg
          width={currentO.width}
          height={currentO.height}
          viewBox="0 0 100 100"
          className="mx-0.5 inline-block align-middle"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="50" cy="50" r="38" stroke="#A8D4EA" strokeWidth="10" />
          <rect x="60" y="46" width="16" height="8" fill="#FDB47B" rx="1" />
          <rect x="24" y="46" width="36" height="8" fill="#DCE8EE" rx="1" />
          <line x1="23" y1="23" x2="77" y2="77" stroke="#A8D4EA" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[#FDB47B]">no</span>
    </div>
  )

  if (!showMascot) {
    return <div className={className}>{wordmark}</div>
  }

  if (layout === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Mascot size={mascotSizes[size]} />
        {wordmark}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Mascot size={mascotSizes[size]} />
      {wordmark}
    </div>
  )
}
