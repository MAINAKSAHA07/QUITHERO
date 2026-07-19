import { motion } from 'framer-motion'
import GlassButton from '../../components/GlassButton'
import { useMotionPrefs } from '../../hooks/useMotionPrefs'
import { QuitArchetype } from '../../types/enums'

interface ArchetypeRevealProps {
  archetype: QuitArchetype
  name: string
  description: string
  icon: string
  characteristics: string[]
  onContinue: () => void
}

export default function ArchetypeReveal({ name, description, icon, characteristics, onContinue }: ArchetypeRevealProps) {
  const { fade, springUi, reduce } = useMotionPrefs()

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-[#F4FBFF] safe-area-top safe-area-bottom">
      <motion.div
        {...(reduce
          ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
          : { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 } })}
        transition={springUi}
        className="w-24 h-24 rounded-full bg-white border border-[#0E2538]/06 shadow-sm flex items-center justify-center mb-6"
      >
        <span className="text-5xl" aria-hidden>{icon}</span>
      </motion.div>

      <motion.div {...fade} transition={{ ...springUi, delay: reduce ? 0 : 0.05 }} className="text-center mb-8">
        <p className="text-sm text-[#3F8DD2] font-semibold mb-1 tracking-wide">
          Your Smono Type
        </p>
        <h1 className="text-3xl font-bold text-[#0E2538] mb-3 tracking-tight">{name}</h1>
        <p className="text-[#0E2538]/55 text-sm max-w-xs mx-auto leading-relaxed">{description}</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-3 mb-10">
        {characteristics.map((trait, i) => (
          <motion.div
            key={i}
            {...fade}
            transition={{ ...springUi, delay: reduce ? 0 : 0.04 * i }}
            className="bg-white/80 border border-[#0E2538]/06 p-4 rounded-xl flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-[#3F8DD2]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#3F8DD2] text-xs font-bold">{i + 1}</span>
            </div>
            <p className="text-sm text-[#0E2538]/75 leading-relaxed">{trait}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA immediately available — never gate on staggered animation */}
      <GlassButton onClick={onContinue} className="px-10 py-4">
        Start My Journey
      </GlassButton>
    </div>
  )
}
