import { InputHTMLAttributes, forwardRef, useMemo } from 'react'

// Remove emojis from text - comprehensive regex pattern
const removeEmojis = (text: string): string => {
  if (!text) return text
  // Comprehensive emoji removal regex covering all Unicode emoji ranges
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Miscellaneous Symbols and Pictographs
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous Symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{2190}-\u{21FF}]/gu, '') // Arrows
    .replace(/[\u{2300}-\u{23FF}]/gu, '') // Miscellaneous Technical
    .replace(/[\u{2B50}-\u{2B55}]/gu, '') // Stars and other symbols
    .replace(/[\u{3030}-\u{303F}]/gu, '') // CJK Symbols and Punctuation
    .replace(/[\u{3299}-\u{3299}]/gu, '') // Circled ideograph
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
    .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
    .replace(/[\u{20E3}]/gu, '') // Combining Enclosing Keycap
    .replace(/[\u{FE0F}]/gu, '') // Variation Selector-16
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim()
}

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, rightIcon, className = '', placeholder, style, ...props }, ref) => {
    // Clean placeholder to remove emojis - ensure it always returns a clean string
    const cleanPlaceholder = useMemo(() => {
      if (!placeholder) return ''
      const placeholderStr = String(placeholder)
      // Remove emojis using comprehensive regex - always return cleaned version
      const cleaned = removeEmojis(placeholderStr)
      // Return cleaned version (will be empty string if placeholder was only emojis)
      return cleaned
    }, [placeholder])

    const paddingStyle = useMemo(() => ({
      ...(icon ? { paddingLeft: '3.5rem' } : {}),
      ...(rightIcon ? { paddingRight: '3.5rem' } : {}),
    }), [icon, rightIcon])

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary/50 z-10 pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`glass-input w-full ${error ? 'border-error' : ''} ${className}`}
            placeholder={cleanPlaceholder}
            style={{ ...paddingStyle, ...style }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-primary/50 z-10 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

export default GlassInput
