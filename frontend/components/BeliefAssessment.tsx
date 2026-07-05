import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { beliefService } from '../services/belief.service'

interface BeliefAssessmentProps {
  assessmentDay: 0 | 15 | 30
  userId: string
  onComplete: () => void
}

const BELIEF_QUESTIONS = [
  { key: 'belief_relaxation', label: 'Smoking relaxes me' },
  { key: 'belief_enjoyment', label: 'I enjoy smoking' },
  { key: 'belief_concentration', label: 'It helps me concentrate' },
  { key: 'belief_social', label: 'I need smoking in social situations' },
  { key: 'belief_stress_relief', label: 'It relieves my stress' },
]

const DAY_HEADINGS: Record<number, string> = {
  0: 'Before we start — how strongly do you hold these beliefs?',
  15: 'Halfway check-in — have your beliefs shifted?',
  30: 'Final reflection — look how far you\'ve come!',
}

export const BeliefAssessment: React.FC<BeliefAssessmentProps> = ({
  assessmentDay,
  userId,
  onComplete,
}) => {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(BELIEF_QUESTIONS.map(q => [q.key, 5]))
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const total = values.belief_relaxation + values.belief_enjoyment + values.belief_concentration + values.belief_social + values.belief_stress_relief
    await beliefService.createAssessment({
      user: userId,
      assessment_day: assessmentDay,
      belief_relaxation: values.belief_relaxation,
      belief_enjoyment: values.belief_enjoyment,
      belief_concentration: values.belief_concentration,
      belief_social: values.belief_social,
      belief_stress_relief: values.belief_stress_relief,
      total_score: total,
    })
    setSaving(false)
    onComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen w-full flex flex-col justify-center py-8"
    >
      <div className="w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background/30 rounded-3xl border border-white/20 shadow-glass-lg backdrop-blur-2xl">
        {/* Navigation & Header (Fixed) */}
        <div className="flex-shrink-0">
          <div className="w-full flex items-center justify-between p-4 bg-background/50 backdrop-blur-md border-b border-white/10">
            <span className="text-text-primary/60 text-xs font-bold uppercase tracking-wider mx-auto">
              Belief Assessment
            </span>
          </div>
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-none flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-6">
            <div className="text-center px-2">
              <h2 className="text-lg font-bold font-display text-text-primary leading-tight mb-2">
                {DAY_HEADINGS[assessmentDay]}
              </h2>
              <p className="text-xs text-text-primary/60 font-medium">
                Rate each belief from 0 (not at all) to 10 (completely true)
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {BELIEF_QUESTIONS.map((q) => (
                <div key={q.key} className="p-5 rounded-2xl bg-white/40 border border-white/25 backdrop-blur-xl shadow-glass flex flex-col gap-3">
                  <label className="text-sm font-semibold text-text-primary/80">
                    {q.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-primary/40 w-4">0</span>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={values[q.key]}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [q.key]: Number(e.target.value) }))
                      }
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-primary focus:outline-none"
                    />
                    <span className="text-sm font-extrabold text-brand-primary w-5 text-right">
                      {values[q.key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl glass-button-primary disabled:opacity-50 text-white text-base font-semibold shadow-glow transition-all duration-200 active:scale-[0.98]"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

