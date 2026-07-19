import { Bell, ShieldAlert, Sparkles, TrendingUp, Heart } from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import { enablePushNotifications } from '../../utils/pushNotifications'

interface NotificationOptInProps {
  onContinue: (enabled: boolean) => void
}

export default function NotificationOptIn({ onContinue }: NotificationOptInProps) {
  const benefits = [
    {
      icon: Sparkles,
      title: 'Smoke check-ins every 6 hours',
      desc: 'Quick prompts to confirm you stayed smoke-free and keep your stats accurate.',
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
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#F4FBFF] relative p-4 justify-center safe-area-top safe-area-bottom">
      <div className="overflow-y-auto max-h-full py-4 scrollbar-thin">
        <GlassCard className="p-6 sm:p-8 text-center" borderGlow={false}>
          <div className="w-16 h-16 rounded-2xl bg-[#3F8DD2]/10 border border-[#3F8DD2]/20 flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8 text-[#3F8DD2]" />
          </div>

          <h1 className="text-2xl font-bold text-[#0E2538] mb-3 tracking-tight">
            Stay supported, every day
          </h1>
          <p className="text-sm text-[#0E2538]/55 mb-8 leading-relaxed">
            Enable reminders for daily modules, craving support prompts, progress nudges, and encouragement when you need it most.
          </p>

          <div className="space-y-4 text-left mb-8">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-[#0E2538]/[0.04] border border-[#0E2538]/08 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#3F8DD2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0E2538]">
                      {b.title}
                    </h3>
                    <p className="text-xs text-[#0E2538]/50 mt-0.5 leading-normal">
                      {b.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-3">
            <GlassButton
              onClick={async () => {
                await enablePushNotifications().catch(() => {})
                onContinue(true)
              }}
              fullWidth
              className="py-4 text-sm font-bold"
            >
              Enable Support Reminders
            </GlassButton>
            <button
              type="button"
              onClick={() => onContinue(false)}
              className="w-full text-center text-[#0E2538]/45 text-sm font-semibold py-2.5 rounded-xl active:scale-[0.98] active:text-[#0E2538]/70 active:bg-[#0E2538]/[0.04] transition-[transform,color,background-color] duration-100"
            >
              Maybe Later
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
