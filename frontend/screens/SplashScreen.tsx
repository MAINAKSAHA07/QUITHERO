import { motion } from 'framer-motion'
import SmonoLogo from '../components/SmonoLogo'

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-bg-soft via-brand-light/20 to-brand-primary/10 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '10%', left: '10%' }}
      />
      <motion.div
        className="absolute w-80 h-80 bg-brand-light/30 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ bottom: '15%', right: '15%' }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <motion.div
          animate={{
            filter: [
              'drop-shadow(0 0 20px rgba(142, 197, 229, 0.3))',
              'drop-shadow(0 0 30px rgba(252, 179, 131, 0.5))',
              'drop-shadow(0 0 20px rgba(142, 197, 229, 0.3))',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-8 flex flex-col items-center"
        >
          <SmonoLogo size="xl" showMascot />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-text-primary/70 text-center text-lg mt-4 font-medium"
        >
          Your Journey to Freedom
        </motion.p>
        
        {/* Animated spinner loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center mt-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full shadow-glow"
          />
        </motion.div>
      </motion.div>

      {/* Version */}
      <div className="absolute bottom-4 text-xs text-text-primary/50">
        Version 1.0.0
      </div>
    </div>
  )
}

