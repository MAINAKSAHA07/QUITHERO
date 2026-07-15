import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import GlassCard from '../components/GlassCard'
import { profileService } from '../services/profile.service'
import { getSubscriptionPrice, getSubscriptionOriginal, getPaywallSavingsFrame } from '../utils/currency'

const FEATURES = [
  'All 30 CBT sessions unlocked',
  'AI-personalized content daily',
  'Advanced craving toolkit',
  'Belief tracking & progress delta',
  'Priority support',
]

export default function Paywall() {
  const navigate = useNavigate()
  const { userProfile, user, fetchUserProfile } = useApp()
  const country = userProfile?.country || 'IN'
  const dailyCigs = userProfile?.daily_consumption || 10

  const price = getSubscriptionPrice(country)
  const original = getSubscriptionOriginal(country)
  const monthlySavings = getPaywallSavingsFrame(country, dailyCigs)

  const handleSubscribe = async () => {
    if (!user?.id) return
    await profileService.upsert(user.id, {
      subscription_status: 'active',
      subscription_started_at: new Date().toISOString(),
      subscription_country: country,
    })
    await fetchUserProfile()
    navigate('/subscription-confirmed')
  }

  const handleSkip = () => {
    navigate('/objection-survey')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full gap-6"
      >
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold text-text-primary">Unlock Your Full Program</h1>
          <p className="text-text-primary/70 mt-2">30 days to freedom — backed by science</p>
        </div>

        <GlassCard className="w-full p-5">
          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-text-primary/80">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="w-full bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-500/20 backdrop-blur-sm">
          <p className="text-xs text-emerald-700 font-semibold">You spend ~{monthlySavings}/month on cigarettes</p>
          <p className="text-xs text-text-primary/60 mt-1">This program costs less than 2 days of smoking</p>
        </div>

        <div className="text-center">
          <p className="text-sm text-text-primary/40 line-through">{original}</p>
          <p className="text-3xl font-bold text-emerald-600">{price}<span className="text-base font-medium text-text-primary/50">/month</span></p>
          <p className="text-xs text-text-primary/60 mt-1">Billed monthly · Cancel anytime</p>
        </div>

        <button
          onClick={handleSubscribe}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg
                     hover:shadow-lg active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10"
        >
          Start My Freedom Journey
        </button>

        <button
          onClick={handleSkip}
          className="text-sm text-text-primary/50 hover:text-text-primary/80 underline"
        >
          Not sure yet? Tell us why
        </button>

        <div className="flex items-center gap-4 text-xs text-text-primary/40 mt-2">
          <span>🔒 Secure payment</span>
          <span>💯 30-day guarantee</span>
        </div>
      </motion.div>
    </div>
  )
}
