import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2 } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import { formatMoney } from '../../utils/currency'
import {
  calculateLifetimeSpend,
  calculateMonthlySpend,
  calculateYearlySpend,
  calculateActiveTimeSpent,
  calculateLifetimeCigarettes,
  calculateLifeMinutesLost,
  calculateCigarettesAvoidedYear
} from '../../utils/onboardingCalculations'

interface InsightSequenceProps {
  dailyConsumption: number
  howLongUsing: number // Months
  packCost: number
  minutesPerCigarette: number
  country?: string
  onComplete: () => void
}

export default function InsightSequence({
  dailyConsumption,
  howLongUsing,
  packCost,
  minutesPerCigarette,
  country,
  onComplete
}: InsightSequenceProps) {
  const [cardIndex, setCardIndex] = useState(0)
  const [loaderProgress, setLoaderProgress] = useState(0)
  const [loaderChecks, setLoaderChecks] = useState<boolean[]>([false, false, false, false])

  // Math Calculations
  const lifetimeSpend = calculateLifetimeSpend(dailyConsumption, howLongUsing, packCost)
  const monthlySpend = calculateMonthlySpend(dailyConsumption, packCost)
  const yearlySpend = calculateYearlySpend(dailyConsumption, packCost)

  const activeTimeMinutes = calculateActiveTimeSpent(dailyConsumption, howLongUsing, minutesPerCigarette)
  const activeHours = Math.round(activeTimeMinutes / 60)
  const activeDays = Math.round(activeHours / 24)

  const lifetimeCigarettes = calculateLifetimeCigarettes(dailyConsumption, howLongUsing)
  const lifeMinutesLost = calculateLifeMinutesLost(dailyConsumption, howLongUsing)
  const lifeDaysLost = Math.round(lifeMinutesLost / 60 / 24)

  const yearlySavings = calculateYearlySpend(dailyConsumption, packCost)
  const avoidedYear = calculateCigarettesAvoidedYear(dailyConsumption)
  const yearlyMinutesReclaimed = dailyConsumption * 365 * minutesPerCigarette
  const yearlyHoursReclaimed = Math.round(yearlyMinutesReclaimed / 60)

  // Simulation loader ticks for Slide 5
  useEffect(() => {
    if (cardIndex === 4) {
      const interval = setInterval(() => {
        setLoaderProgress((prev) => {
          const next = prev + 2
          if (next >= 100) {
            clearInterval(interval)
            return 100
          }
          return next
        })
      }, 50)
      return () => clearInterval(interval)
    }
  }, [cardIndex])

  useEffect(() => {
    if (cardIndex === 4) {
      if (loaderProgress > 20) setLoaderChecks((c) => [true, c[1], c[2], c[3]])
      if (loaderProgress > 50) setLoaderChecks((c) => [true, true, c[2], c[3]])
      if (loaderProgress > 75) setLoaderChecks((c) => [true, true, true, c[3]])
      if (loaderProgress >= 100) {
        setLoaderChecks([true, true, true, true])
        // Wait a small moment and then auto continue
        const t = setTimeout(() => {
          onComplete()
        }, 800)
        return () => clearTimeout(t)
      }
    }
  }, [loaderProgress, cardIndex, onComplete])

  const handleNext = () => {
    if (cardIndex < 4) {
      setCardIndex(cardIndex + 1)
    }
  }

  const cards = [
    // Card 1: Cost Reveal
    {
      title: 'This habit has cost more than you think.',
      subtitle: 'Based on your actual consumption details.',
      visual: (
        <div className="space-y-4 my-6">
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
            <span className="text-sm text-text-primary/70">Estimated Lifetime Cost</span>
            <span className="text-xl font-bold text-red-400">{formatMoney(lifetimeSpend, country)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="block text-xs text-text-primary/60">Monthly Cost</span>
              <span className="text-lg font-bold text-text-primary mt-1 block">
                {formatMoney(monthlySpend, country)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="block text-xs text-text-primary/60">Yearly Cost</span>
              <span className="text-lg font-bold text-text-primary mt-1 block">
                {formatMoney(yearlySpend, country)}
              </span>
            </div>
          </div>
        </div>
      ),
      tip: 'The good news? That money stays in your wallet starting today.',
      btnText: 'Understand Time Spent',
    },
    // Card 2: Time Spent
    {
      title: 'Hours lost that you can start reclaiming.',
      subtitle: `Based on ~${minutesPerCigarette} minutes spent per session.`,
      visual: (
        <div className="space-y-4 my-6">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
            <span className="text-sm text-text-primary/70">Active Time Spent</span>
            <span className="text-xl font-bold text-amber-400">{activeHours.toLocaleString()} Hours</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-sm text-text-primary/60">Equivalent to roughly</span>
            <span className="block text-2xl font-bold text-text-primary mt-1">
              {activeDays} Full Days
            </span>
            <span className="text-xs text-text-primary/45 mt-1 block">
              of active smoking from lighting to finish.
            </span>
          </div>
        </div>
      ),
      tip: 'Imagine what you could do with those hours back.',
      btnText: 'Reveal Health Impact',
    },
    // Card 3: Health Toll
    {
      title: 'Your body has carried the load.',
      subtitle: 'Safe, educational estimates based on medical guidelines.',
      visual: (
        <div className="space-y-4 my-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <span className="block text-xs text-text-primary/60 font-semibold">Cigarettes Consumed</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">
                {lifetimeCigarettes.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <span className="block text-xs text-text-primary/60 font-semibold">Stamina Impact</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">
                {lifeDaysLost} Days
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs text-text-primary/60 leading-relaxed">
            🌿 <strong>Educational Note:</strong> Every session temporarily increases carbon monoxide in your blood. Quitting allows your lungs and circulatory system to restore their natural capacity.
          </div>
        </div>
      ),
      tip: 'Within 24 hours of quitting, your oxygen levels return to normal.',
      btnText: 'Look at the Future',
    },
    // Card 4: Reclaimed Future
    {
      title: 'Now imagine what you could regain.',
      subtitle: 'Your potential progress in just one year of quitting.',
      visual: (
        <div className="space-y-4 my-6">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-success/5 border border-success/15 text-center">
              <span className="block text-[10px] text-text-primary/60 uppercase font-semibold">Money Reclaimed</span>
              <span className="text-base font-bold text-success mt-1 block">
                {formatMoney(yearlySavings, country)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-success/5 border border-success/15 text-center">
              <span className="block text-[10px] text-text-primary/60 uppercase font-semibold">Avoided Units</span>
              <span className="text-base font-bold text-success mt-1 block">
                {avoidedYear.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-success/5 border border-success/15 text-center">
              <span className="block text-[10px] text-text-primary/60 uppercase font-semibold">Time Saved</span>
              <span className="text-base font-bold text-success mt-1 block">
                {yearlyHoursReclaimed} hrs
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-center text-xs text-text-primary/80">
            ✨ Smono helps you lock in these gains day by day.
          </div>
        </div>
      ),
      tip: 'The decisions you make today pave the way for this future.',
      btnText: 'Build My Program',
    },
    // Card 5: Plan Loader
    {
      title: 'Building your personal reset plan',
      subtitle: 'Analyzing responses to calibrate your daily CBT modules...',
      visual: (
        <div className="space-y-4 my-8 text-left max-w-sm mx-auto">
          {[
            'Mapping emotional triggers',
            'Matching support intensity preference',
            'Preparing baseline CBT check-ins',
            'Setting optimal check-in reminders'
          ].map((text, i) => {
            const isDone = loaderChecks[i]
            return (
              <div key={i} className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-text-primary/30 animate-spin flex-shrink-0" />
                )}
                <span className={`text-sm ${isDone ? 'text-text-primary' : 'text-text-primary/50'}`}>
                  {text}
                </span>
              </div>
            )
          })}

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-6">
            <div
              className="h-full bg-brand-primary transition-all duration-75"
              style={{ width: `${loaderProgress}%` }}
            />
          </div>
        </div>
      ),
      tip: 'This plan is CBT-inspired and personalized to you.',
      btnText: 'Loading...',
    }
  ]

  const current = cards[cardIndex]

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5 p-4 justify-center">
      <div className="overflow-y-auto max-h-full py-4 scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div
            key={cardIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
          >
            <GlassCard className="p-6 sm:p-8 border-white/10 shadow-glow bg-background-card/45 backdrop-blur-xl">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 text-center">
                {current.title}
              </h1>
              <p className="text-xs sm:text-sm text-text-primary/60 text-center mb-6">
                {current.subtitle}
              </p>

              {current.visual}

              <p className="text-xs text-text-primary/50 text-center mt-4 mb-6 leading-relaxed italic">
                {current.tip}
              </p>

              {cardIndex < 4 && (
                <GlassButton
                  onClick={handleNext}
                  fullWidth
                  className="py-4 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {current.btnText}
                </GlassButton>
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
