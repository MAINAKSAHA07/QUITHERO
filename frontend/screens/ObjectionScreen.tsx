import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

interface ObjectionConfig {
  title: string
  body: string
  reframe: string
}

const OBJECTIONS: Record<string, ObjectionConfig> = {
  cost: {
    title: "Let's talk about cost",
    body: "You spend thousands on cigarettes every year. One month of Smono costs less than a couple of days of smoking — and it could change your life.",
    reframe: "Think of it as redirecting money you're already spending on something that's killing you.",
  },
  willpower: {
    title: 'Willpower alone rarely works',
    body: "Research shows only 3-5% of smokers quit cold turkey long-term. CBT-based programs like this one raise success rates to 25-30% — that's 6x better odds.",
    reframe: "It's not about being weak. It's about using the right tools.",
  },
  doubt: {
    title: 'Do apps actually work?',
    body: "Clinical trials show CBT-based digital interventions significantly increase quit rates. Our approach combines daily cognitive restructuring with AI personalization.",
    reframe: "This isn't a generic tracker — it's a structured therapy program in your pocket.",
  },
  timing: {
    title: "There's never a 'perfect' time",
    body: "Waiting for the right moment is one of the most common traps. Every day you delay costs you health, money, and freedom.",
    reframe: "The best time to quit was yesterday. The second best time is today.",
  },
  privacy: {
    title: 'Your data is safe',
    body: "All data stays on your device and our secure server. We never sell personal information. You can export or delete everything at any time.",
    reframe: "You're in full control — we built this with privacy-first principles.",
  },
  commitment: {
    title: "It's okay to feel scared",
    body: "Fear of failure is normal. That's exactly why this program is 30 days — small steps, daily support, no pressure to be perfect.",
    reframe: "You don't have to quit perfectly. You just have to start.",
  },
}

export default function ObjectionScreen() {
  const { key } = useParams<{ key: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const concerns = (location.state as any)?.concerns as string[] | undefined

  const config = OBJECTIONS[key || ''] || OBJECTIONS.cost

  const currentIndex = concerns?.indexOf(key || '') ?? -1
  const nextConcern = concerns && currentIndex < concerns.length - 1 ? concerns[currentIndex + 1] : null

  const handleNext = () => {
    if (nextConcern) {
      navigate(`/objection/${nextConcern}`, { state: { concerns } })
    } else {
      navigate('/paywall')
    }
  }

  const handleSkip = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-6"
      >
        <h1 className="text-xl font-bold text-text-primary">{config.title}</h1>

        <p className="text-text-primary/80 leading-relaxed">{config.body}</p>

        <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm rounded-xl p-4 shadow-sm">
          <p className="text-sm text-emerald-800 font-medium italic">"{config.reframe}"</p>
        </div>

        <div className="mt-auto flex flex-col gap-3 pb-6">
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md
                       active:scale-[0.98] transition-transform"
          >
            {nextConcern ? 'Next concern' : 'I\'m ready — show me the plan'}
          </button>
          <button onClick={handleSkip} className="text-sm text-text-primary/50 hover:text-text-primary/80 text-center">
            Continue with free version
          </button>
        </div>
      </motion.div>
    </div>
  )
}
