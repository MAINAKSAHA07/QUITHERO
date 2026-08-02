export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/** Phone/tablet — not desktop. Coarse pointer catches some tablets without mobile UA. */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (isIosDevice() || isAndroidDevice()) return true
  return window.matchMedia('(max-width: 768px) and (pointer: coarse)').matches
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

/**
 * Install “Add to Home Screen” only in a mobile browser tab —
 * never desktop, never Capacitor native, never already-installed PWA.
 */
export function shouldOfferInstallPrompt(isNative = false): boolean {
  if (isNative || isStandalonePwa()) return false
  return isMobileDevice()
}

export function wasDismissedRecently(key: string, days = 7): boolean {
  const last = localStorage.getItem(key)
  if (!last) return false
  return Date.now() - Number(last) < days * 24 * 60 * 60 * 1000
}

export function markDismissed(key: string) {
  localStorage.setItem(key, String(Date.now()))
}

/** Permanent — only after they actually installed (Android accept) or we detect standalone. */
export const INSTALL_DONE_KEY = 'smono_install_done'
/** Soft dismiss — next visit / new session asks again until they install. */
export const INSTALL_SESSION_DISMISS_KEY = 'smono_install_prompt_session'
/** @deprecated kept for old localStorage cleanup */
export const INSTALL_DISMISS_KEY = 'smono_install_prompt_dismissed'
export const NOTIF_DISMISS_KEY = 'smono_notif_prompt_dismissed'
/** Once per browser tab/session — “Later” until they close the app and come back. */
export const NOTIF_SESSION_DISMISS_KEY = 'smono_notif_prompt_session'

export function wasDismissedThisSession(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function markDismissedThisSession(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    /* private mode */
  }
}

export function markInstallDone() {
  try {
    localStorage.setItem(INSTALL_DONE_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function isInstallMarkedDone(): boolean {
  try {
    return localStorage.getItem(INSTALL_DONE_KEY) === '1'
  } catch {
    return false
  }
}
