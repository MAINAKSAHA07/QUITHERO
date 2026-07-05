import { motion } from 'framer-motion'
import { DollarSign, Clock, Heart } from 'lucide-react'
import GlassButton from './GlassButton'
import { formatMoney, getCountryConfig } from '../utils/currency'

interface InsightInterstitialProps {
  dailyConsumption: number
  monthsUsing: number
  country?: string
  onContinue: () => void
}

const MINUTES_PER_CIGARETTE = 7
const LIFE_MINUTES_LOST_PER_CIGARETTE = 11

export default function InsightInterstitial({ dailyConsumption, monthsUsing, country, onContinue }: InsightInterstitialProps) {
  const config = getCountryConfig(country)
  const totalDays = monthsUsing * 30
  const totalCigarettes = dailyConsumption * totalDays
  const moneySpent = totalCigarettes * config.pricePerCigarette
  const timeSpentHours = Math.round((totalCigarettes * MINUTES_PER_CIGARETTE) / 60)
  const lifeLostDays = Math.round((totalCigarettes * LIFE_MINUTES_LOST_PER_CIGARETTE) / 60 / 24)

  const insights = [
    {
      icon: DollarSign,
      label: 'Money spent smoking',
      value: formatMoney(moneySpent, country),
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: Clock,
      label: 'Hours of your life spent smoking',
      value: `${timeSpentHours.toLocaleString()} hrs`,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Heart,
      label: 'Days of life expectancy lost',
      value: `${lifeLostDays} days`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Here's what smoking has cost you
        </h1>
        <p className="text-text-primary/60 text-sm">
          Based on what you've shared
        </p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.25, duration: 0.4 }}
              className="glass p-5 rounded-2xl flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl ${insight.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${insight.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-primary/60">{insight.label}</p>
                <p className={`text-2xl font-bold ${insight.color}`}>{insight.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-10 text-center"
      >
        <p className="text-text-primary/70 text-sm mb-6">
          The good news? Every day from now is a day you keep.
        </p>
        <GlassButton onClick={onContinue} className="px-10 py-4">
          Let's change this
        </GlassButton>
      </motion.div>
    </div>
  )
}
