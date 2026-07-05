import { useState } from 'react'
import { motion } from 'framer-motion'
import GlassCard from './GlassCard'
import GlassButton from './GlassButton'
import { TriggerCheckContent } from '../types/models'

interface TriggerCheckMCQProps {
  check: TriggerCheckContent
  onComplete: (selected: string) => void
}

export default function TriggerCheckMCQ({ check, onComplete }: TriggerCheckMCQProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <GlassCard className="p-5 mb-4 border-brand-primary/20 bg-brand-primary/5">
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-wide text-brand-primary">Quick check-in</span>
        <h3 className="text-base font-bold text-text-primary mt-2 leading-snug">{check.question}</h3>
      </div>
      <div className="space-y-2">
        {check.options.map((option) => {
          const isSelected = selected === option
          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                isSelected
                  ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                  : 'border-white/10 bg-white/5 text-text-primary/80 hover:border-brand-primary/40'
              }`}
            >
              {option}
            </motion.button>
          )
        })}
      </div>
      <GlassButton
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        fullWidth
        className="mt-4 py-3.5 font-bold"
      >
        Continue
      </GlassButton>
    </GlassCard>
  )
}
