/**
 * Runnable check: npx tsx frontend/utils/appTour.check.ts
 */
const store: Record<string, string> = {}
;(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = String(v)
  },
  removeItem: (k: string) => {
    delete store[k]
  },
}

async function main() {
  const {
    hasSeenAppTour,
    markAppTourSeen,
    shouldAutoShowAppTour,
    isWelcomeBackTour,
    tourWelcomeCopy,
    APP_TOUR_INACTIVE_MS,
    touchAppEngagement,
  } = await import('./appTour')

  if (hasSeenAppTour()) throw new Error('fresh: not seen')
  if (isWelcomeBackTour()) throw new Error('fresh: not welcome back')
  if (!shouldAutoShowAppTour()) throw new Error('fresh: should auto-show')
  if (tourWelcomeCopy(false).title !== 'Welcome to Smono') throw new Error('first title')

  markAppTourSeen()
  if (!hasSeenAppTour() || !isWelcomeBackTour()) throw new Error('after mark')
  if (tourWelcomeCopy(true).title !== 'Welcome back to Smono') throw new Error('back title')
  if (shouldAutoShowAppTour()) throw new Error('just seen: no auto')

  store.lastAppEngagementAt = String(Date.now() - APP_TOUR_INACTIVE_MS - 1000)
  if (!shouldAutoShowAppTour()) throw new Error('idle 7d: should auto')

  touchAppEngagement()
  if (shouldAutoShowAppTour()) throw new Error('touched: no auto')

  console.log('appTour.check: ok')
}

main()
