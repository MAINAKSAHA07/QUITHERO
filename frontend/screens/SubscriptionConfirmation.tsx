import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useMotionPrefs } from '../hooks/useMotionPrefs'

const BULLETS = [
  'All 30 sessions are now unlocked',
  'AI personalization is active',
  'Your journey starts today',
]

export default function SubscriptionConfirmation() {
  const navigate = useNavigate()
  const { fade, springUi, pop, reduce } = useMotionPrefs()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home'), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 relative bg-[#F4FBFF] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139, 205, 232, 0.4), transparent 70%)',
        }}
        aria-hidden
      />

      <motion.div
        {...pop}
        transition={springUi}
        className="relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6 shadow-[0_8px_28px_rgba(63,141,210,0.35)]"
        style={{ background: 'linear-gradient(135deg, #3F8DD2, #8BCDE8)' }}
      >
        <Check className="w-9 h-9 text-white" strokeWidth={3} />
      </motion.div>

      <motion.h1
        {...fade}
        transition={{ ...springUi, delay: reduce ? 0 : 0.08 }}
        className="relative z-10 text-[28px] font-bold text-[#0E2538] text-center tracking-tight"
        style={{ letterSpacing: '-0.02em' }}
      >
        You’re all set
      </motion.h1>

      <motion.div
        {...fade}
        transition={{ ...springUi, delay: reduce ? 0 : 0.16 }}
        className="relative z-10 mt-6 flex flex-col gap-3.5"
      >
        {BULLETS.map((b) => (
          <div key={b} className="flex items-center gap-3 text-[#0E2538]/80">
            <span className="w-6 h-6 rounded-full bg-[#E8F4FC] text-[#3F8DD2] flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5" strokeWidth={2.75} />
            </span>
            <span className="text-[15px]">{b}</span>
          </div>
        ))}
      </motion.div>

      <motion.p
        {...fade}
        transition={{ ...springUi, delay: reduce ? 0 : 0.28 }}
        className="relative z-10 mt-10 text-[12px] text-[#0E2538]/40"
      >
        Taking you home…
      </motion.p>
    </div>
  )
}
