import {
  useId,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import { useApp } from '../context/AppContext'
import { usesHandwritingFont } from '../utils/handwritingLang'

type HandwrittenJournalProps = {
  value: string
  onChange: (value: string) => void
  label?: ReactNode
  /** Display-only prompt above the page (not animated while typing). */
  prompt?: ReactNode
  placeholder?: string
  minRows?: number
  footer?: ReactNode
  className?: string
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'onChange' | 'placeholder' | 'className'
  >
}

/**
 * Lined-paper journaling surface.
 * User input uses Kalam for Latin + Devanagari; CJK falls back to Inter.
 */
export default function HandwrittenJournal({
  value,
  onChange,
  label,
  prompt,
  placeholder = 'Write a few sentences in your own words…',
  minRows = 6,
  footer,
  className = '',
  textareaProps,
}: HandwrittenJournalProps) {
  const { language } = useApp()
  const handwriting = usesHandwritingFont(language)
  const id = useId()

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary/80">
          {label}
        </label>
      )}

      <div
        className={`journal-paper ${handwriting ? 'journal-paper--hand' : 'journal-paper--print'}`}
      >
        {prompt && (
          <div
            className={`journal-paper__prompt ${
              handwriting ? 'font-handwriting' : 'font-sans'
            }`}
          >
            {prompt}
          </div>
        )}
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          {...textareaProps}
          className={`journal-paper__input ${
            handwriting ? 'font-handwriting' : 'font-sans'
          }`}
        />
        {footer && <div className="journal-paper__footer">{footer}</div>}
      </div>
    </div>
  )
}
