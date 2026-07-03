import { motion } from 'framer-motion'
import GlassButton from '../../components/GlassButton'
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
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 rounded-full glass flex items-center justify-center mb-6"
      >
        <span className="text-5xl">{icon}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center mb-8"
      >
        <p className="text-sm text-brand-primary font-medium mb-1 uppercase tracking-wider">
          Your Smono Type
        </p>
        <h1 className="text-3xl font-bold text-text-primary mb-3">{name}</h1>
        <p className="text-text-primary/70 text-sm max-w-xs mx-auto">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="w-full max-w-sm space-y-3 mb-10"
      >
        {characteristics.map((trait, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 + i * 0.15 }}
            className="glass p-4 rounded-xl flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-primary text-xs font-bold">{i + 1}</span>
            </div>
            <p className="text-sm text-text-primary/80">{trait}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <GlassButton onClick={onContinue} className="px-10 py-4">
          Start My Journey
        </GlassButton>
      </motion.div>
    </div>
  )
}
