import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMotionPrefs } from '../hooks/useMotionPrefs'

/** Login ↔ Sign up segmented control — instant press + clear selected state. */
export default function AuthModeTabs({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { springUi, reduce } = useMotionPrefs()

  const go = (next: 'login' | 'signup') => {
    if (next === mode) return
    navigate(next === 'login' ? '/login' : '/signup', { state: location.state })
  }

  return (
    <div
      role="tablist"
      aria-label="Account"
      className="relative grid grid-cols-2 p-1 rounded-2xl bg-[#0E2538]/[0.06] mb-6"
    >
      {!reduce && (
        <motion.div
          layout={false}
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-[0_2px_10px_rgba(14,37,56,0.08)] border border-[#0E2538]/06"
          initial={false}
          animate={{ left: mode === 'login' ? 4 : 'calc(50% + 0px)' }}
          transition={springUi}
          aria-hidden
        />
      )}
      {(
        [
          { id: 'login' as const, label: 'Log in' },
          { id: 'signup' as const, label: 'Sign up' },
        ] as const
      ).map((tab) => {
        const selected = mode === tab.id
        return (
          <motion.button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            // Press feedback always — even when springs are off (native / reduced-motion)
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => go(tab.id)}
            className={`relative z-10 py-2.5 text-[15px] font-semibold rounded-xl transition-colors duration-100 ${
              selected
                ? 'text-[#0E2538]'
                : 'text-[#0E2538]/45 active:text-[#0E2538]/70'
            } ${reduce && selected ? 'bg-white shadow-sm border border-[#0E2538]/06' : ''}`}
          >
            {tab.label}
          </motion.button>
        )
      })}
    </div>
  )
}
