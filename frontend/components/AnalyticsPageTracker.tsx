import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { analyticsService } from '../services/analytics.service'
import { behaviorTracker } from '../services/behavior-tracker.service'
import { analyticsPageFromPath } from '../utils/analyticsPage'

/** One page_view per route change — covers every screen without per-page hooks. */
export default function AnalyticsPageTracker() {
  const location = useLocation()
  const { user } = useApp()
  const lastKey = useRef('')

  useEffect(() => {
    const page = analyticsPageFromPath(location.pathname)
    const key = `${page}|${location.pathname}`
    if (key === lastKey.current) return
    lastKey.current = key

    void analyticsService.trackPageView(page, user?.id)
    if (user?.id) behaviorTracker.trackPageView(page)
  }, [location.pathname, user?.id])

  return null
}
