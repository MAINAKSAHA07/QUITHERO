import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, Heart, MessageCircle } from 'lucide-react'
import TopNavigation from '../components/TopNavigation'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'

const slides = [
  {
    icon: Calendar,
    title: 'Track Your Journey',
    description: 'Monitor your progress day by day with visual insights',
    gradient: 'from-info/20 to-brand-primary/20',
  },
  {
    icon: Users,
    title: 'Personalized Program',
    description: '10-day structured program tailored to your needs',
    gradient: 'from-brand-primary/20 to-brand-accent/20',
  },
  {
    icon: Heart,
    title: '24/7 Support',
    description: 'Instant craving support whenever you need it',
    gradient: 'from-success/20 to-info/20',
  },
  {
    icon: MessageCircle,
    title: 'Join Our Community',
    description: 'Connect with others on the same journey',
    gradient: 'from-brand-accent/20 to-brand-primary/20',
  },
]

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()

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

  const Icon = slides[currentSlide].icon

  return (
    <div className="min-h-screen pb-20">
      <TopNavigation
        left="logo"
        center=""
        right={
          <button
            onClick={handleSkip}
            className="text-text-primary/70 hover:text-text-primary text-sm font-medium"
          >
            Skip
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-12 flex justify-center"
            >
              <GlassCard
                className={`p-8 bg-gradient-to-br ${slides[currentSlide].gradient}`}
              >
                <Icon className="w-24 h-24 text-brand-primary" />
              </GlassCard>
            </motion.div>

            {/* Content */}
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg text-text-primary/70 mb-12">
              {slides[currentSlide].description}
            </p>

            {/* Page indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {slides.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-8 bg-brand-primary'
                      : 'w-2 bg-text-primary/30'
                  }`}
                  initial={false}
                />
              ))}
            </div>

            {/* Button */}
            <GlassButton onClick={handleNext} fullWidth className="py-4 text-lg">
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </GlassButton>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

