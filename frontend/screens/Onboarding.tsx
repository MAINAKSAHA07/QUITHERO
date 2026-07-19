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
import TranslatedText from '../components/TranslatedText'
import { useTouchSwipe } from '../hooks/useTouchSwipe'
import { useMotionPrefs } from '../hooks/useMotionPrefs'
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
  const { fade, springUi } = useMotionPrefs()

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
      navigate('/login', { state: { isNew: true } })
    }
  }

  const handleSkip = () => {
    navigate('/login', { state: { isNew: true } })
  }

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1)
  }

  const swipeHandlers = useTouchSwipe(handleNext, handlePrev)

  const Icon = slides[currentSlide].icon

  return (
    <div className="min-h-[100dvh] pb-20 flex flex-col justify-between relative bg-[#F4FBFF] safe-area-top">
      {currentSlide < slides.length - 1 && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 text-[#0E2538]/40 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0E2538]/[0.05] active:scale-95 active:text-[#0E2538]/70 transition-[transform,color,background-color] duration-100"
        >
          <TranslatedText text="Skip" />
        </button>
      )}

      <div className="app-container flex-1 px-4 pt-12 flex flex-col justify-center" {...swipeHandlers}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            {...fade}
            transition={springUi}
            className="text-center flex flex-col items-center"
          >
            <div className="mb-8 flex justify-center">
              <GlassCard
                borderGlow={false}
                className={`p-6 bg-gradient-to-br ${slides[currentSlide].gradient}`}
              >
                <Icon className="w-20 h-20 text-[#3F8DD2] mx-auto" />
              </GlassCard>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0E2538] mb-4 leading-tight tracking-tight px-2">
              <TranslatedText text={slides[currentSlide].title} />
            </h1>
            <p className="text-base text-[#0E2538]/55 mb-8 max-w-md px-4 leading-relaxed">
              <TranslatedText text={slides[currentSlide].description} />
            </p>

            <div className="flex justify-center gap-1.5 mb-8" role="tablist" aria-label="Slides">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={index === currentSlide}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-[width,background-color,transform] duration-200 ease-out active:scale-90 ${
                    index === currentSlide
                      ? 'w-6 bg-[#3F8DD2]'
                      : 'w-1.5 bg-[#0E2538]/20 active:bg-[#0E2538]/40'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <div className="w-full max-w-sm px-4">
              <GlassButton onClick={handleNext} fullWidth className="py-3.5 text-base font-semibold flex items-center justify-center gap-2">
                {currentSlide === slides.length - 1 ? (
                  <>
                    <TranslatedText text="Start My Plan" /> <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <TranslatedText text="Next" />
                )}
              </GlassButton>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
