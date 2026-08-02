import { motion, useReducedMotion } from 'framer-motion'
import { Heart, Wind, BookOpen, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import GlassButton from './GlassButton'
import TranslatedText from './TranslatedText'

export type SlipAchievementPreview = {
  title: string
  description?: string
}

interface SlipRecoveryProps {
  daysFree: number
  /** Formatted money lost for this slip, e.g. "₹12" */
  amountLost?: string
  /** Tentative nicotine from this slip, e.g. "0.8mg" */
  nicotineConsumed?: string
  /** Tentative life lost, e.g. "~11 min" */
  lifeLost?: string
  programStarted?: boolean
  /** KYC-personalized headline */
  headline?: string
  /** KYC motivation anchor */
  motivationLine?: string
  /** Unlocked achievements to remind them how far they've come */
  achievements?: SlipAchievementPreview[]
  onDismiss: () => void
}

export default function SlipRecovery({
  daysFree,
  amountLost,
  nicotineConsumed,
  lifeLost,
  programStarted = true,
  headline,
  motivationLine,
  achievements = [],
  onDismiss,
}: SlipRecoveryProps) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const hasImpact = Boolean(amountLost || nicotineConsumed || lifeLost)
  const title =
    headline ||
    `One cigarette doesn't erase${daysFree > 0 ? ` ${daysFree} days of` : ' your'} progress`
  const body =
    motivationLine ||
    "A slip is data, not failure. You noticed it, you logged it — that's awareness in action. Most successful quitters slip once or twice. What matters is what you do next."

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 safe-area-top safe-area-bottom">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6"
      >
        <Heart className="w-10 h-10 text-brand-primary" />
      </motion.div>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.12, duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-6 max-w-sm"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-3 leading-snug">
          <TranslatedText text={title} />
        </h1>
        <p className="text-text-primary/70 text-sm mx-auto leading-relaxed mb-3">
          <TranslatedText text={body} />
        </p>
        <p className="text-text-primary/55 text-xs mx-auto leading-relaxed">
          <TranslatedText text="No worries — a slip does not erase what you have already built. You can still change what happens next." />
        </p>
      </motion.div>

      {achievements.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.16, duration: 0.2 }}
          className="w-full max-w-sm mb-6"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary/80 mb-2 text-center">
            <TranslatedText text="You've already earned" />
          </p>
          <ul className="space-y-2">
            {achievements.slice(0, 4).map((a) => (
              <li
                key={a.title}
                className="glass rounded-xl px-3.5 py-3 flex items-start gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    <TranslatedText text={a.title} />
                  </p>
                  {a.description ? (
                    <p className="text-xs text-text-primary/55 mt-0.5 line-clamp-2">
                      <TranslatedText text={a.description} />
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      {hasImpact ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.18, duration: 0.2 }}
          className="mb-6 w-full max-w-xs rounded-2xl border border-[#D96B6B]/25 bg-[#FFF5F5] px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D96B6B]/80 mb-2 text-center">
            <TranslatedText text="This slip cost you (estimate)" />
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {amountLost ? (
              <div>
                <p className="text-lg font-black text-[#D96B6B] leading-tight">{amountLost}</p>
                <p className="text-[10px] text-[#D96B6B]/70 mt-0.5">
                  <TranslatedText text="Money" />
                </p>
              </div>
            ) : null}
            {nicotineConsumed ? (
              <div>
                <p className="text-lg font-black text-[#D96B6B] leading-tight">{nicotineConsumed}</p>
                <p className="text-[10px] text-[#D96B6B]/70 mt-0.5">
                  <TranslatedText text="Nicotine" />
                </p>
              </div>
            ) : null}
            {lifeLost ? (
              <div>
                <p className="text-lg font-black text-[#D96B6B] leading-tight">{lifeLost}</p>
                <p className="text-[10px] text-[#D96B6B]/70 mt-0.5">
                  <TranslatedText text="Life" />
                </p>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.2, duration: 0.2 }}
        className="w-full max-w-sm space-y-3 mb-8"
      >
        <button
          type="button"
          onClick={() => navigate('/breathing')}
          className="w-full glass p-4 rounded-xl flex items-center gap-4 text-left transition-transform duration-100 ease-out active:scale-[0.97]"
        >
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Wind className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              <TranslatedText text="Breathing Exercise" />
            </p>
            <p className="text-xs text-text-primary/60">
              <TranslatedText text="2 minutes to reset your nervous system" />
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/sessions')}
          className="w-full glass p-4 rounded-xl flex items-center gap-4 text-left transition-transform duration-100 ease-out active:scale-[0.97]"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              <TranslatedText
                text={programStarted ? 'Continue Your Program' : 'Start Program'}
              />
            </p>
            <p className="text-xs text-text-primary/60">
              <TranslatedText
                text={
                  programStarted
                    ? 'Your next session is waiting'
                    : 'Day 1 is ready when you are'
                }
              />
            </p>
          </div>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.28, duration: 0.2 }}
      >
        <GlassButton variant="secondary" onClick={onDismiss} className="px-8 py-3">
          <TranslatedText text="Back to Home" />
        </GlassButton>
      </motion.div>
    </div>
  )
}
