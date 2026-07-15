const SEEN_KEY = 'hasSeenAppTour'
const ENGAGEMENT_KEY = 'lastAppEngagementAt'
/** Show tour again after this much idle time (ms). */
export const APP_TOUR_INACTIVE_MS = 7 * 24 * 60 * 60 * 1000

export type TourTargetId = 'home' | 'sessions' | 'craving' | 'progress' | 'profile'

type TourListener = () => void
const listeners = new Set<TourListener>()

export function hasSeenAppTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === 'true'
  } catch {
    return false
  }
}

export function markAppTourSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, 'true')
  } catch {
    /* private mode / quota */
  }
  touchAppEngagement()
}

export function touchAppEngagement(): void {
  try {
    localStorage.setItem(ENGAGEMENT_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function getLastAppEngagementAt(): number | null {
  try {
    const raw = localStorage.getItem(ENGAGEMENT_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** New user (never finished tour) or idle longer than 7 days. */
export function shouldAutoShowAppTour(): boolean {
  if (!hasSeenAppTour()) return true
  const last = getLastAppEngagementAt()
  if (last == null) return false
  return Date.now() - last >= APP_TOUR_INACTIVE_MS
}

export function requestAppTour(): void {
  listeners.forEach((cb) => cb())
}

export function onAppTourRequest(cb: TourListener): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export const APP_TOUR_ROUTES = [
  '/home',
  '/sessions',
  '/progress',
  '/profile',
  '/craving',
  '/journal',
  '/breathing',
] as const

export function isAppTourRoute(pathname: string): boolean {
  return APP_TOUR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function tourTargetSelector(id: TourTargetId): string {
  return `[data-tour-id="${id}"]`
}
