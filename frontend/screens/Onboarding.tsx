import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Heart,
  Activity,
  Brain,
  Map,
  Smile,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import { useTouchSwipe } from '../hooks/useTouchSwipe'
import { useApp } from '../context/AppContext'
import { profileService } from '../services/profile.service'
import { postAuthPath } from '../utils/kyc'

const slides = [
  {
    icon: Sparkles,
    title: 'Congratulations, your quit journey begins.',
    description: 'You’ve taken the first step toward reclaiming your health, energy, and freedom.',
    gradient: 'from-amber-500/20 to-brand-primary/20',
  },
  {
    icon: Brain,
    title: 'Quit without fighting yourself.',
    description: 'Smono helps you reduce dependence on willpower by understanding what actually drives the habit.',
    gradient: 'from-brand-primary/20 to-brand-accent/20',
  },
  {
    icon: Activity,
    title: 'Don’t just quit. Stop wanting it.',
    description: 'The goal is not endless resistance. The goal is to change the loop behind the craving.',
    gradient: 'from-success/20 to-brand-primary/20',
  },
  {
    icon: Map,
    title: 'Understand your smoking pattern.',
    description: 'Map when, where, and why you smoke so your plan can feel personal.',
    gradient: 'from-brand-accent/20 to-info/20',
  },
  {
    icon: Calendar,
    title: 'Build a daily reset.',
    description: 'Follow short CBT-inspired sessions, craving tools, and progress check-ins designed for real life.',
    gradient: 'from-info/20 to-success/20',
  },
  {
    icon: Smile,
    title: 'No guilt. No shame. Just support.',
    description: 'Slips do not erase progress. Smono helps you learn from them and keep moving.',
    gradient: 'from-success/25 to-brand-accent/15',
  },
  {
    icon: Heart,
    title: 'Ready to build your quit plan?',
    description: 'Answer a few questions so Smono can personalize your journey.',
    gradient: 'from-brand-primary/35 to-brand-accent/35',
  },
]

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()
  const { isAuthenticated, user } = useApp()

  // Returning users should not see marketing slides again
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    profileService.getByUserId(user.id).then((result) => {
      navigate(postAuthPath(result.data), { replace: true })
    })
  }, [isAuthenticated, user?.id, navigate])

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      navigate('/login')
    }
  }

  const handleSkip = () => {
    navigate('/login')
  }

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1)
  }

  const swipeHandlers = useTouchSwipe(handleNext, handlePrev)

  const Icon = slides[currentSlide].icon

  return (
    <div className="min-h-screen pb-20 flex flex-col justify-between relative">
      {currentSlide < slides.length - 1 && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 text-text-primary/40 hover:text-text-primary text-xs font-semibold px-3 py-1.5 rounded-full glass-subtle transition-all"
        >
          Skip
        </button>
      )}

      <div className="app-container flex-1 px-4 pt-12 flex flex-col justify-center" {...swipeHandlers}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="text-center flex flex-col items-center"
          >
            {/* Visual Icon Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-8 flex justify-center"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GlassCard
                  className={`p-6 bg-gradient-to-br ${slides[currentSlide].gradient} shadow-glow border-white/10`}
                >
                  <Icon className="w-20 h-20 text-brand-primary filter drop-shadow-md mx-auto" />
                </GlassCard>
              </motion.div>
            </motion.div>

            {/* Typography */}
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4 leading-tight px-2">
              {slides[currentSlide].title}
            </h1>
            <p className="text-base text-text-primary/70 mb-8 max-w-md px-4 leading-relaxed">
              {slides[currentSlide].description}
            </p>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-1.5 mb-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-6 bg-brand-primary'
                      : 'w-1.5 bg-text-primary/20 hover:bg-text-primary/45'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Main Action Button */}
            <div className="w-full max-w-sm px-4">
              <GlassButton onClick={handleNext} fullWidth className="py-3.5 text-base font-semibold flex items-center justify-center gap-2">
                {currentSlide === slides.length - 1 ? (
                  <>
                    Start My Plan <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Next'
                )}
              </GlassButton>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
