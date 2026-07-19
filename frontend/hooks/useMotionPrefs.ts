import { useReducedMotion } from 'framer-motion'
import { isNativePlatform } from '../utils/apiOrigin'

/** Shared reduced-motion-aware spring / fade presets for app UI. */
export function useMotionPrefs() {
  // WKWebView + springs = jank; treat native like reduced-motion for transforms
  const reduce = !!useReducedMotion() || isNativePlatform()
  return {
    reduce,
    fade: reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 8 },
        },
    /** Icon / badge pop — never scale(0) */
    pop: reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
        },
    tap: reduce ? {} : { scale: 0.97 },
    springUi: reduce
      ? { type: 'tween' as const, duration: 0.18 }
      : { type: 'spring' as const, stiffness: 380, damping: 28 },
  }
}
