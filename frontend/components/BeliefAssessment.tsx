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
      className="flex flex-col gap-6 p-6"
    >
      <h2 className="text-xl font-bold text-center text-slate-800">
        {DAY_HEADINGS[assessmentDay]}
      </h2>
      <p className="text-sm text-slate-500 text-center">
        Rate each belief from 0 (not at all) to 10 (completely true)
      </p>

      <div className="flex flex-col gap-5">
        {BELIEF_QUESTIONS.map((q) => (
          <div key={q.key} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              {q.label}
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-4">0</span>
              <input
                type="range"
                min={0}
                max={10}
                value={values[q.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [q.key]: Number(e.target.value) }))
                }
                className="flex-1 accent-emerald-500"
              />
              <span className="text-xs font-semibold text-emerald-600 w-5 text-right">
                {values[q.key]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold
                   disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {saving ? 'Saving...' : 'Continue'}
      </button>
    </motion.div>
  )
}
