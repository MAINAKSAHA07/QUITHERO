/**
 * Haptic feedback utility using Web Vibration API.
 * Graceful no-op on unsupported browsers.
 */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

export const hapticPatterns = {
  tap: 10,
  select: [10, 20, 10],
  success: [30, 20, 80],
  achievement: [50, 30, 50, 30, 100],
  error: [100, 50, 100],
}
