import { useRef, useCallback } from 'react'

const SWIPE_THRESHOLD = 60
const IGNORE_SWIPE_SELECTOR = 'input, textarea, button, select, a, label, [data-no-swipe]'

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export function useTouchSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void): SwipeHandlers {
  const startX = useRef(0)
  const tracking = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest(IGNORE_SWIPE_SELECTOR)) {
      tracking.current = false
      return
    }
    tracking.current = true
    startX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!tracking.current) return
    tracking.current = false
    const delta = e.changedTouches[0].clientX - startX.current
    if (delta < -SWIPE_THRESHOLD && onSwipeLeft) onSwipeLeft()
    if (delta > SWIPE_THRESHOLD && onSwipeRight) onSwipeRight()
  }, [onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchEnd }
}
