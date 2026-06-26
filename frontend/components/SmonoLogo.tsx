interface SmonoLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function SmonoLogo({ className = '', size = 'md' }: SmonoLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }

  // Dimension scaling for the custom no-smoking 'o' SVG
  const oSizes = {
    sm: { width: '1.25rem', height: '1.25rem' },
    md: { width: '1.45rem', height: '1.45rem' },
    lg: { width: '2.2rem', height: '2.2rem' },
    xl: { width: '3.4rem', height: '3.4rem' },
  }

  const currentO = oSizes[size]

  return (
    <div className={`flex items-center font-black select-none tracking-tight leading-none ${sizeClasses[size]} ${className}`}>
      {/* "smo" in Smono Blue */}
      <span className="text-[#A8D4EA] flex items-center">
        <span>sm</span>
        <svg
          width={currentO.width}
          height={currentO.height}
          viewBox="0 0 100 100"
          className="mx-0.5 inline-block align-middle"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main outer circle */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="#A8D4EA"
            strokeWidth="10"
          />
          {/* Cigarette filter (orange) on the right */}
          <rect
            x="60"
            y="46"
            width="16"
            height="8"
            fill="#FDB47B"
            rx="1"
          />
          {/* Cigarette body (light gray/blue) on the left */}
          <rect
            x="24"
            y="46"
            width="36"
            height="8"
            fill="#DCE8EE"
            rx="1"
          />
          {/* Diagonal slash on top */}
          <line
            x1="23"
            y1="23"
            x2="77"
            y2="77"
            stroke="#A8D4EA"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {/* "no" in Smono Orange */}
      <span className="text-[#FDB47B]">no</span>
    </div>
  )
}
