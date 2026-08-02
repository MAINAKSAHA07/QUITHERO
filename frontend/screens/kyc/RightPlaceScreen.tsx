import { ChevronLeft } from 'lucide-react'
import GlassButton from '../../components/GlassButton'
import TranslatedText from '../../components/TranslatedText'

const PILLARS = [
  { icon: '🧠', label: 'Cognitive behaviour change' },
  { icon: '⚡', label: 'Neural retraining' },
  { icon: '🍃', label: 'Mindfulness and craving control' },
  { icon: '🤝', label: '1:1 support and community motivation' },
] as const

interface RightPlaceScreenProps {
  onContinue: () => void
  onBack?: () => void
}

/** Early KYC trust screen — mirrors marketing “four pillars” + WHO compliance. */
export default function RightPlaceScreen({ onContinue, onBack }: RightPlaceScreenProps) {
  return (
    <div className="h-screen max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#F4FBFF] relative safe-area-top safe-area-bottom">
      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4 scrollbar-thin">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-white border border-[#0E2538]/08 shadow-sm flex items-center justify-center text-[#0E2538]/70 active:scale-[0.96] transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="h-10" />
        )}

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div
            className="w-11 h-11 rounded-xl mb-4 shadow-sm"
            style={{
              background: 'linear-gradient(145deg, #6EA48F 0%, #3F8DD2 100%)',
            }}
            aria-hidden
          />
          <h1 className="text-[1.35rem] sm:text-2xl font-extrabold text-[#0E2538] tracking-wide uppercase leading-tight">
            <TranslatedText text="You're in the right place" />
          </h1>
          <p className="text-sm text-[#0E2538]/50 mt-2.5 leading-relaxed max-w-xs">
            <TranslatedText text="Smono brings together four powerful pillars:" />
          </p>
        </div>

        <ul className="space-y-2.5 mb-5">
          {PILLARS.map((p) => (
            <li
              key={p.label}
              className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 border border-[#0E2538]/06 shadow-[0_2px_10px_rgba(14,37,56,0.04)]"
            >
              <span className="text-xl w-8 text-center flex-shrink-0" aria-hidden>
                {p.icon}
              </span>
              <span className="text-[0.95rem] font-semibold text-[#0E2538] text-left leading-snug">
                <TranslatedText text={p.label} />
              </span>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl bg-white/80 border border-[#3F8DD2]/15 px-4 py-3 mb-5 text-center">
          <p className="text-xs font-semibold text-[#3F8DD2] uppercase tracking-wide mb-1">
            <TranslatedText text="WHO-aligned" />
          </p>
          <p className="text-sm text-[#0E2538]/70 leading-relaxed">
            <TranslatedText text="Smono follows and complies with World Health Organization (WHO) guidelines for tobacco cessation support." />
          </p>
        </div>

        <p className="text-center text-sm text-[#0E2538]/65 leading-relaxed px-1 mb-2">
          <span className="font-bold text-[#0E2538]">
            <TranslatedText text="This is not just a tracker." />
          </span>
          <br />
          <TranslatedText text="This is a structured program designed to help you change how you think and feel about smoking." />
        </p>
      </div>

      <div className="px-5 pb-5 pt-2 bg-gradient-to-t from-[#F4FBFF] via-[#F4FBFF] to-transparent">
        <GlassButton onClick={onContinue} fullWidth className="py-4 text-sm font-bold">
          <TranslatedText text="Continue" />
        </GlassButton>
      </div>
    </div>
  )
}
