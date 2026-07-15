import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassButton from './GlassButton'
import {
  markAppTourSeen,
  tourTargetSelector,
  type TourTargetId,
} from '../utils/appTour'

export type TourStep = {
  title: string
  body: string
  /** Bottom-nav target; omit for centered welcome/closing cards */
  target?: TourTargetId
}

export const APP_TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome back to Smono',
    body: 'A short tour of the main buttons — we’ll highlight each one so you know where things live.',
  },
  {
    target: 'home',
    title: 'Home',
    body: 'Your daily hub: quit progress, today’s focus, and quick entry into the program.',
  },
  {
    target: 'sessions',
    title: 'Sessions',
    body: 'Your guided program days. Open Sessions to start or continue today’s lesson.',
  },
  {
    target: 'craving',
    title: 'Craving Support',
    body: 'When an urge hits, tap the center button for tools, breathing, and a quick reset.',
  },
  {
    target: 'progress',
    title: 'Progress',
    body: 'Smoke-free days, money saved, milestones, and craving insights — all in one place.',
  },
  {
    target: 'profile',
    title: 'Profile',
    body: 'Settings, notifications, language, and account. You can replay this tour anytime here.',
  },
  {
    title: "You're set",
    body: 'That’s the main navigation. Start with today’s session whenever you’re ready.',
  },
]

type Rect = { top: number; left: number; width: number; height: number }

type Props = {
  isOpen: boolean
  onClose: () => void
}

function readTargetRect(target?: TourTargetId): Rect | null {
  if (!target || typeof document === 'undefined') return null
  const el = document.querySelector(tourTargetSelector(target)) as HTMLElement | null
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return null
  const pad = target === 'craving' ? 10 : 8
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  }
}

export default function AppTourModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [hole, setHole] = useState<Rect | null>(null)
  const total = APP_TOUR_STEPS.length
  const current = APP_TOUR_STEPS[step]
  const isLast = step === total - 1

  const measure = useCallback(() => {
    setHole(readTargetRect(current?.target))
  }, [current?.target])

  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen])

  useLayoutEffect(() => {
    if (!isOpen) return
    measure()
    // Wait a frame for bottom nav layout after route paint
    const t = window.setTimeout(measure, 50)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [isOpen, step, measure])

  const finish = () => {
    markAppTourSeen()
    onClose()
  }

  const next = () => {
    if (isLast) finish()
    else setStep((s) => s + 1)
  }

  const back = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const tipMotion = tipPlacement(hole, !!current?.target)

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-tour-title"
          className="fixed inset-0 z-[60]"
        >
          {/* Dim with cutout over the targeted nav icon */}
          <div className="absolute inset-0 pointer-events-auto" aria-hidden="true">
            {hole ? (
              <div
                className="absolute rounded-2xl border-2 border-white/90 transition-all duration-200"
                style={{
                  top: hole.top,
                  left: hole.left,
                  width: hole.width,
                  height: hole.height,
                  boxShadow: '0 0 0 9999px rgba(14, 37, 56, 0.72)',
                  borderRadius: current.target === 'craving' ? '999px' : '16px',
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-[#0E2538]/72 backdrop-blur-[2px]" />
            )}
          </div>

          {/* Tip card — above highlighted icon or centered */}
          <motion.div
            key={step}
            initial={tipMotion.initial}
            animate={tipMotion.animate}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[61] w-[min(20rem,calc(100%-2rem))] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 box-border"
            style={tipMotion.style}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0E2538]/45 mb-1.5">
              {step + 1} / {total}
            </p>
            <h2 id="app-tour-title" className="text-lg font-bold text-[#0E2538] mb-1.5">
              {current.title}
            </h2>
            <p className="text-sm text-[#0E2538]/70 leading-relaxed mb-4">{current.body}</p>

            <div className="flex justify-center gap-1.5 mb-4" aria-hidden="true">
              {APP_TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-5 bg-[#3F8DD2]' : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={finish}
                className="text-sm font-semibold text-[#0E2538]/45 px-2 py-2 hover:text-[#0E2538]/75"
              >
                Skip
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <GlassButton onClick={back} className="px-4 py-2 text-sm">
                    Back
                  </GlassButton>
                )}
                <GlassButton onClick={next} className="px-5 py-2 text-sm">
                  {isLast ? 'Got it' : 'Next'}
                </GlassButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type TipMotion = {
  style: CSSProperties
  initial: { opacity: number; x?: string | number; y?: string | number }
  animate: { opacity: number; x?: string | number; y?: string | number }
}

function tipPlacement(hole: Rect | null, hasTarget: boolean): TipMotion {
  // Centered welcome / closing — keep x/y in motion so Framer doesn't wipe CSS transform
  if (!hasTarget) {
    return {
      style: { left: '50%', top: '50%' },
      initial: { opacity: 0, x: '-50%', y: 'calc(-50% + 10px)' },
      animate: { opacity: 1, x: '-50%', y: '-50%' },
    }
  }

  // Waiting for nav rect — stay invisible; never use x:-50% or leftover Framer x clips left tabs
  if (!hole) {
    return {
      style: { left: 16, top: 0 },
      initial: { opacity: 0, x: 0, y: 0 },
      animate: { opacity: 0, x: 0, y: 0 },
    }
  }

  const gap = 14
  const tipApproxHeight = 220
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400
  const tipW = Math.min(320, vw - 32)
  const spaceAbove = hole.top
  const placeAbove = spaceAbove > tipApproxHeight + gap
  const centerX = hole.left + hole.width / 2
  // Clamp so the card never leaves the viewport (Home is far-left; without this + x:0, half vanishes)
  const left = Math.min(Math.max(16, centerX - tipW / 2), Math.max(16, vw - 16 - tipW))

  const top = placeAbove
    ? Math.max(12, hole.top - tipApproxHeight - gap)
    : hole.top + hole.height + gap

  return {
    style: { left, top },
    // x:0 must be explicit — Framer keeps prior x:'-50%' from the welcome step otherwise
    initial: { opacity: 0, x: 0, y: 10 },
    animate: { opacity: 1, x: 0, y: 0 },
  }
}

