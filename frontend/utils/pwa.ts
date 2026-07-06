export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

export function wasDismissedRecently(key: string, days = 7): boolean {
  const last = localStorage.getItem(key)
  if (!last) return false
  return Date.now() - Number(last) < days * 24 * 60 * 60 * 1000
}

export function markDismissed(key: string) {
  localStorage.setItem(key, String(Date.now()))
}

export const INSTALL_DISMISS_KEY = 'smono_install_prompt_dismissed'
export const NOTIF_DISMISS_KEY = 'smono_notif_prompt_dismissed'
