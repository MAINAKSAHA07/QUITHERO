import { InputHTMLAttributes, forwardRef, useMemo, useState } from 'react'

// Remove emojis from text - comprehensive regex pattern
const removeEmojis = (text: string): string => {
  if (!text) return text
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2190}-\u{21FF}]/gu, '')
    .replace(/[\u{2300}-\u{23FF}]/gu, '')
    .replace(/[\u{2B50}-\u{2B55}]/gu, '')
    .replace(/[\u{3030}-\u{303F}]/gu, '')
    .replace(/[\u{3299}-\u{3299}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/[\u{20E3}]/gu, '')
    .replace(/[\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, icon, rightIcon, className = '', placeholder, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false)

    const cleanPlaceholder = useMemo(() => {
      if (!placeholder) return ''
      return removeEmojis(String(placeholder))
    }, [placeholder])

    const paddingStyle = useMemo(
      () => ({
        ...(icon ? { paddingLeft: '3.5rem' } : {}),
        ...(rightIcon ? { paddingRight: '3.5rem' } : {}),
      }),
      [icon, rightIcon]
    )

    return (
      <div className="w-full">
        {label && (
          <label
            className={`block text-sm font-medium mb-2 transition-colors duration-100 ${
              focused ? 'text-[#3F8DD2]' : error ? 'text-error' : 'text-[#0E2538]'
            }`}
          >
            {label}
          </label>
        )}
        <div
          className={`relative rounded-2xl transition-[box-shadow,transform] duration-100 ease-out ${
            focused
              ? 'shadow-[0_0_0_3px_rgba(63,141,210,0.28)] scale-[1.01]'
              : error
                ? 'shadow-[0_0_0_2px_rgba(220,38,38,0.25)]'
                : 'shadow-none'
          }`}
        >
          {icon && (
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center transition-colors duration-100 ${
                focused ? 'text-[#3F8DD2]' : 'text-[#0E2538]/40'
              }`}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`glass-input w-full !rounded-2xl ${error ? 'border-error' : focused ? '!border-[#3F8DD2]/50' : ''} ${className}`}
            placeholder={cleanPlaceholder}
            style={{ ...paddingStyle, ...style }}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            {...props}
          />
          {rightIcon && (
            <div
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center transition-colors duration-100 ${
                focused ? 'text-[#3F8DD2]' : 'text-[#0E2538]/40'
              }`}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

export default GlassInput
