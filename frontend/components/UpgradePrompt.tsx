import { useNavigate } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'
import TranslatedText from './TranslatedText'

type Variant = 'card' | 'compact' | 'overlay'

/** Landing-aligned CTA accents: sky blue + peach + sage (not blue-only). */
const CTA_GRAD = 'linear-gradient(135deg, #3F8DD2 0%, #6EA48F 100%)'
const CTA_GRAD_WIDE = 'linear-gradient(90deg, #3F8DD2 0%, #6EA48F 55%, #F6B884 100%)'

/** Unlock CTA for free users past Day 1 — hidden for paid. */
export default function UpgradePrompt({
  variant = 'card',
  className = '',
}: {
  variant?: Variant
  className?: string
}) {
  const navigate = useNavigate()

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={() => navigate('/paywall')}
        className={`w-full flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-left
          bg-white/70 backdrop-blur-[20px] saturate-[180%]
          border border-white/80
          shadow-[0_8px_32px_rgba(14,37,56,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]
          active:scale-[0.98] transition-transform duration-100
          ${className}`}
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(63,141,210,0.12) 0%, rgba(255,255,255,0.55) 45%, rgba(246,184,132,0.18) 100%)',
        }}
      >
        <span className="w-10 h-10 rounded-2xl bg-[#FFF1E6] border border-[#F6B884]/35 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-[#C46A2E]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-bold tracking-tight text-[#0E2538]">
            <TranslatedText text="Unlock Day 2–30" />
          </span>
          <span className="block text-[11px] font-medium text-[#4A6574] mt-0.5">
            <TranslatedText text="Continue your full quit program" />
          </span>
        </span>
        <span
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm"
          style={{ background: CTA_GRAD }}
        >
          <ArrowRight className="w-4 h-4" />
        </span>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => navigate('/paywall')}
        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-white active:scale-[0.98] transition-transform duration-100 ${className}`}
        style={{ background: 'linear-gradient(135deg, #0E2538 0%, #1a3d55 60%, #2a4a3d 100%)' }}
      >
        <span className="w-9 h-9 rounded-xl bg-[#F6B884]/20 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-[#F6B884]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold tracking-tight">
            <TranslatedText text="Unlock Day 2–30" />
          </span>
          <span className="block text-[11px] text-white/60 mt-0.5">
            <TranslatedText text="Continue your full quit program" />
          </span>
        </span>
        <ArrowRight className="w-4 h-4 text-[#F6B884] flex-shrink-0" />
      </button>
    )
  }

  return (
    <section
      className={`rounded-3xl overflow-hidden border border-[#8BCDE8]/40 bg-white/80 shadow-[0_8px_30px_rgba(90,130,150,0.10)] ${className}`}
    >
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background:
            'linear-gradient(135deg, rgba(63,141,210,0.14) 0%, rgba(110,164,143,0.12) 50%, rgba(246,184,132,0.22) 100%)',
        }}
      >
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl bg-white/90 border border-[#F6B884]/30 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-[#C46A2E]" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6EA48F] mb-1">
              <TranslatedText text="Day 1 complete" />
            </p>
            <h3 className="text-[17px] font-bold text-[#0E2538] tracking-tight leading-snug">
              <TranslatedText text="Unlock the rest of your program" />
            </h3>
            <p className="text-sm text-[#4A6574] mt-1.5 leading-relaxed">
              <TranslatedText text="Days 2–30, craving tools, and your full personalized plan stay locked until you upgrade." />
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-1 bg-[#FFF1E6]/35">
        <button
          type="button"
          onClick={() => navigate('/paywall')}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-100"
          style={{ background: CTA_GRAD_WIDE }}
        >
          <TranslatedText text="Unlock Day 2" />
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}
