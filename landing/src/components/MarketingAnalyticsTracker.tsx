import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackMetaEvent, trackMetaPageView } from '../lib/metaPixel'
import {
  MARKETING_TRACK_PATHS,
  marketingContentName,
  trackGaEvent,
  trackGaPageView,
} from '../lib/ga'

/**
 * GA4 page_view on every route + Meta PageView on SPA navigations.
 * Important pages also get ViewContent / view_item.
 */
export function MarketingAnalyticsTracker() {
  const { pathname, search } = useLocation()
  const isFirst = useRef(true)

  useEffect(() => {
    const path = `${pathname}${search}`
    const normalized = pathname.replace(/\/$/, '') || '/'
    const first = isFirst.current
    if (first) isFirst.current = false

    // index.html already fired Meta PageView + GA page_view on first paint
    if (!first) {
      trackMetaPageView()
      trackGaPageView(path)
    }

    if (MARKETING_TRACK_PATHS.has(normalized) || MARKETING_TRACK_PATHS.has(pathname)) {
      const content_name = marketingContentName(pathname)
      trackMetaEvent('ViewContent', {
        content_name,
        content_category: 'marketing',
      })
      trackGaEvent('view_item', {
        item_name: content_name,
        item_category: 'marketing',
      })
    }
  }, [pathname, search])

  return null
}
