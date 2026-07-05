import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const CONCERNS = [
  { id: 'cost', label: "It's too expensive" },
  { id: 'willpower', label: "I think I can quit on my own" },
  { id: 'doubt', label: "I don't believe apps work" },
  { id: 'timing', label: "It's not the right time" },
  { id: 'privacy', label: "I'm worried about my data" },
  { id: 'commitment', label: "I'm scared to commit" },
]

export default function ObjectionSurvey() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleContinue = () => {
    if (selected.length === 0) {
      navigate('/home')
      return
    }
    navigate(`/objection/${selected[0]}`, { state: { concerns: selected } })
  }

  const handleSkip = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full gap-6"
      >
        <div className="text-center mt-8">
          <h1 className="text-xl font-bold text-text-primary">What's holding you back?</h1>
          <p className="text-sm text-text-primary/70 mt-2">Select all that apply — we'll address each one</p>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {CONCERNS.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border backdrop-blur-sm transition-all active:scale-[0.98] ${
                selected.includes(c.id)
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 font-medium'
                  : 'border-white/40 bg-white/45 text-text-primary/80 hover:bg-white/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pb-6">
          <button
            onClick={handleContinue}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md
                       active:scale-[0.98] transition-transform"
          >
            {selected.length > 0 ? 'Address my concerns' : 'Continue free'}
          </button>
          <button onClick={handleSkip} className="text-sm text-text-primary/50 hover:text-text-primary/80 text-center">
            Skip — I'll use the free version
          </button>
        </div>
      </motion.div>
    </div>
  )
}
