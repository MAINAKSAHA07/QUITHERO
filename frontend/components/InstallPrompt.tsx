import { useState, useEffect, useRef } from 'react'
import { Share, PlusSquare, X, Bell, Download } from 'lucide-react'
import { enablePushWithFeedback } from '../utils/pushNotifications'
import { useApp } from '../context/AppContext'
import { isNativePlatform } from '../utils/apiOrigin'
import {
  isAndroidDevice,
  isIosDevice,
  isStandalonePwa,
  shouldOfferInstallPrompt,
  wasDismissedThisSession,
  markDismissedThisSession,
  markInstallDone,
  isInstallMarkedDone,
  INSTALL_SESSION_DISMISS_KEY,
  NOTIF_SESSION_DISMISS_KEY,
} from '../utils/pwa'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const { isAuthenticated } = useApp()
  const [showInstall, setShowInstall] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isAndroidInstall, setIsAndroidInstall] = useState(false)
  const reaskTimer = useRef<number | undefined>(undefined)
  const permission =
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  const denied = permission === 'denied'

  const dismissInstallThisSession = () => {
    markDismissedThisSession(INSTALL_SESSION_DISMISS_KEY)
    setShowInstall(false)
    // Soft re-ask later in the same visit if they still haven’t installed
    if (reaskTimer.current) window.clearTimeout(reaskTimer.current)
    reaskTimer.current = window.setTimeout(() => {
      if (
        shouldOfferInstallPrompt(isNativePlatform()) &&
        !isInstallMarkedDone() &&
        !isStandalonePwa()
      ) {
        // Clear session flag so the sheet can show again
        try {
          sessionStorage.removeItem(INSTALL_SESSION_DISMISS_KEY)
        } catch {
          /* private mode */
        }
        setShowInstall(true)
      }
    }, 45_000)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug_install') === 'true') {
      setShowInstall(true)
      return
    }
    if (params.get('debug_notif') === 'true') {
      setShowNotif(true)
      return
    }

    // If they already run as PWA, never ask to install again
    if (isStandalonePwa() || isNativePlatform()) {
      markInstallDone()
      return
    }
    if (isInstallMarkedDone()) return

    const offerInstall =
      shouldOfferInstallPrompt(false) &&
      !wasDismissedThisSession(INSTALL_SESSION_DISMISS_KEY)

    const onBip = (e: Event) => {
      e.preventDefault()
      if (!shouldOfferInstallPrompt(false) || isInstallMarkedDone()) return
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsAndroidInstall(true)
      if (!wasDismissedThisSession(INSTALL_SESSION_DISMISS_KEY)) {
        window.setTimeout(() => setShowInstall(true), 2500)
      }
    }
    window.addEventListener('beforeinstallprompt', onBip)

    // Notifications: every platform (desktop + mobile) until granted — unrelated to install
    let notifTimer: number | undefined
    let installTimer: number | undefined

    const scheduleInstall = (delayMs: number) => {
      if (!offerInstall) return
      installTimer = window.setTimeout(() => {
        if (isStandalonePwa() || isInstallMarkedDone()) return
        setShowInstall(true)
      }, delayMs)
    }

    if (
      isAuthenticated &&
      'Notification' in window &&
      Notification.permission !== 'granted' &&
      !wasDismissedThisSession(NOTIF_SESSION_DISMISS_KEY)
    ) {
      notifTimer = window.setTimeout(() => setShowNotif(true), 1600)
      // Mobile browser: install after notif soft-ask (desktop never schedules install)
      if (offerInstall) scheduleInstall(5200)
    } else if (offerInstall) {
      scheduleInstall(isIosDevice() ? 1500 : 2800)
    }

    return () => {
      if (notifTimer) clearTimeout(notifTimer)
      if (installTimer) clearTimeout(installTimer)
      if (reaskTimer.current) clearTimeout(reaskTimer.current)
      window.removeEventListener('beforeinstallprompt', onBip)
    }
  }, [isAuthenticated])

  const dismissNotifThisSession = () => {
    markDismissedThisSession(NOTIF_SESSION_DISMISS_KEY)
    setShowNotif(false)
  }

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) {
      dismissInstallThisSession()
      return
    }
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (choice.outcome === 'accepted') {
      markInstallDone()
      setShowInstall(false)
      return
    }
    dismissInstallThisSession()
  }

  const handleEnableNotifications = async () => {
    setShowNotif(false)
    await enablePushWithFeedback()
    markDismissedThisSession(NOTIF_SESSION_DISMISS_KEY)
  }

  // One sheet at a time — notif first, then install
  if (showNotif) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in max-w-md mx-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="rounded-2xl p-5 bg-white border border-[#0E2538]/08 shadow-2xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4FC] flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#3F8DD2]" />
              </div>
              <div>
                <h4 className="font-bold text-[#0E2538] text-sm">Allow notifications</h4>
                <p className="text-[10px] text-[#0E2538]/45 font-medium">
                  Reminders, craving help & support replies
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissNotifThisSession}
              className="p-1 text-[#0E2538]/35 hover:text-[#0E2538]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {denied ? (
            <p className="text-xs text-[#0E2538]/70 leading-relaxed mb-4">
              Notifications are blocked for this site. Open your browser or phone settings, allow
              notifications for smono, then reopen the app.
            </p>
          ) : (
            <p className="text-xs text-[#0E2538]/70 leading-relaxed mb-4">
              Turn on alerts so we can nudge you for sessions and ping you when Support replies —
              even when smono is closed.
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={dismissNotifThisSession}
              className="flex-1 py-2.5 rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] text-xs font-semibold text-[#0E2538]/60"
            >
              Later
            </button>
            {denied ? (
              <button
                type="button"
                onClick={dismissNotifThisSession}
                className="flex-1 py-2.5 rounded-xl bg-[#3F8DD2] text-white text-xs font-bold"
              >
                Got it
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="flex-1 py-2.5 rounded-xl bg-[#3F8DD2] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" /> Allow
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in max-w-md mx-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="rounded-2xl p-5 bg-white border border-[#0E2538]/08 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img src="/mascot.png" alt="" className="w-10 h-10 rounded-xl" />
            <div>
              <h4 className="font-bold text-[#0E2538] text-sm">Add smono to Home Screen</h4>
              <p className="text-[10px] text-[#0E2538]/45 font-medium">
                Use it like an app — faster, full screen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissInstallThisSession}
            className="p-1 text-[#0E2538]/35 hover:text-[#0E2538]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAndroidInstall && deferredPrompt ? (
          <>
            <p className="text-xs text-[#0E2538]/70 leading-relaxed mb-4">
              Install smono for faster launch, full-screen experience, and reliable reminders.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={dismissInstallThisSession}
                className="flex-1 py-2.5 rounded-xl border border-[#0E2538]/10 bg-[#F4FBFF] text-xs font-semibold text-[#0E2538]/60"
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleInstallAndroid}
                className="flex-1 py-2.5 rounded-xl bg-[#3F8DD2] text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Install
              </button>
            </div>
          </>
        ) : isAndroidDevice() ? (
          <>
            <p className="text-xs text-[#0E2538]/70 leading-relaxed mb-4">
              Open your browser menu (⋮) and tap <strong>Install app</strong> or{' '}
              <strong>Add to Home screen</strong>.
            </p>
            <button
              type="button"
              onClick={dismissInstallThisSession}
              className="w-full py-2.5 rounded-xl bg-[#3F8DD2] text-white text-xs font-bold"
            >
              Got it — ask me again later
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-[#0E2538]/70 leading-relaxed mb-4">
              Add smono to your home screen for standalone access and lock-screen reminders on
              iPhone.
            </p>
            <div className="space-y-3 border-t border-[#0E2538]/08 pt-3 text-xs text-[#0E2538]/80">
              <div className="flex items-center gap-3">
                <Share className="w-4 h-4 text-[#3F8DD2] shrink-0" />
                <span>
                  1. Tap <strong className="text-[#3F8DD2]">Share</strong> in Safari
                </span>
              </div>
              <div className="flex items-center gap-3">
                <PlusSquare className="w-4 h-4 text-[#3F8DD2] shrink-0" />
                <span>
                  2. Choose <strong className="text-[#3F8DD2]">Add to Home Screen</strong>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissInstallThisSession}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#3F8DD2] text-white text-xs font-bold"
            >
              Got it — ask me again later
            </button>
          </>
        )}
      </div>
    </div>
  )
}
