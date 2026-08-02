import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackMetaPageView } from '../lib/metaPixel'

/** SPA route changes — skip duplicate first hit when index.html already fired PageView. */
export default function MetaPixelPageTracker() {
  const { pathname, search } = useLocation()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    trackMetaPageView()
  }, [pathname, search])

  return null
}
