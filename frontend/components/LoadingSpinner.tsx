interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <img
          src="/mascot.png"
          alt="Loading..."
          className={`${sizeClasses[size]} object-contain animate-bounce`}
        />
      </div>
      {text && <p className="text-text-primary/70 text-base font-medium">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center min-h-[60vh]">{content}</div>
}

