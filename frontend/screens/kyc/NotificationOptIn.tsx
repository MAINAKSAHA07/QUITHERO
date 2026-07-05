import { Bell, ShieldAlert, Sparkles, TrendingUp, Heart } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'

interface NotificationOptInProps {
  onContinue: (enabled: boolean) => void
}

export default function NotificationOptIn({ onContinue }: NotificationOptInProps) {
  const benefits = [
    {
      icon: Sparkles,
      title: 'Daily program reminders',
      desc: 'Short, daily check-ins to build consistency.',
    },
    {
      icon: ShieldAlert,
      title: 'Craving rescue prompts',
      desc: 'Instant breathing or CBT tools when you face triggers.',
    },
    {
      icon: TrendingUp,
      title: 'Weekly progress & savings check-ins',
      desc: 'See your cumulative cash saved and health milestones.',
    },
    {
      icon: Heart,
      title: 'Encouragement at high-risk times',
      desc: 'Quiet, positive nudges calibrated to your emotional profile.',
    },
  ]

  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-background relative border-x border-white/5 p-4 justify-center">
      <div className="overflow-y-auto max-h-full py-4 scrollbar-thin">
        <GlassCard className="p-6 sm:p-8 border-white/10 shadow-glow text-center bg-background-card/45 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8 text-brand-primary" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-3">
            Stay supported, every day
          </h1>
          <p className="text-sm text-text-primary/70 mb-8 leading-relaxed">
            Enable reminders for daily modules, craving support prompts, progress nudges, and encouragement when you need it most.
          </p>

          <div className="space-y-4 text-left mb-8">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {b.title}
                    </h3>
                    <p className="text-xs text-text-primary/60 mt-0.5 leading-normal">
                      {b.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-3">
            <GlassButton
              onClick={() => onContinue(true)}
              fullWidth
              className="py-4 text-sm font-bold shadow-glow"
            >
              Enable Support Reminders
            </GlassButton>
            <button
              onClick={() => onContinue(false)}
              className="w-full text-center text-text-primary/50 hover:text-text-primary text-sm font-semibold py-2 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
