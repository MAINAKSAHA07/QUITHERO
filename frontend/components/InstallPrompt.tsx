import { useState, useEffect } from 'react'
import { Share, PlusSquare, X, Bell, Download } from 'lucide-react'
import { enablePushWithFeedback } from '../utils/pushNotifications'
import { useApp } from '../context/AppContext'
import {
  isIosDevice,
  isStandalonePwa,
  wasDismissedRecently,
  markDismissed,
  wasDismissedThisSession,
  markDismissedThisSession,
  INSTALL_DISMISS_KEY,
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
  const permission =
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  const denied = permission === 'denied'

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

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!wasDismissedRecently(INSTALL_DISMISS_KEY) && !isStandalonePwa()) {
        setIsAndroidInstall(true)
        setTimeout(() => setShowInstall(true), 2500)
      }
    }
    window.addEventListener('beforeinstallprompt', onBip)

    const ios = isIosDevice()
    const standalone = isStandalonePwa()

    // Ask every app open until granted (Later only skips this session).
    let notifTimer: number | undefined
    if (
      isAuthenticated &&
      'Notification' in window &&
      Notification.permission !== 'granted' &&
      !wasDismissedThisSession(NOTIF_SESSION_DISMISS_KEY)
    ) {
      notifTimer = window.setTimeout(() => setShowNotif(true), 1600)
    } else if (ios && !standalone && !wasDismissedRecently(INSTALL_DISMISS_KEY)) {
      const t = window.setTimeout(() => setShowInstall(true), 1500)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onBip)
      }
    }

    return () => {
      if (notifTimer) clearTimeout(notifTimer)
      window.removeEventListener('beforeinstallprompt', onBip)
    }
  }, [isAuthenticated])

  const dismissNotifThisSession = () => {
    markDismissedThisSession(NOTIF_SESSION_DISMISS_KEY)
    setShowNotif(false)
  }

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) {
      markDismissed(INSTALL_DISMISS_KEY)
      setShowInstall(false)
      return
    }
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    markDismissed(INSTALL_DISMISS_KEY)
    setShowInstall(false)
  }

  const handleEnableNotifications = async () => {
    setShowNotif(false)
    await enablePushWithFeedback()
    markDismissedThisSession(NOTIF_SESSION_DISMISS_KEY)
  }

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
              <p className="text-[10px] text-[#0E2538]/45 font-medium">App-like access, one tap away</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              markDismissed(INSTALL_DISMISS_KEY)
              setShowInstall(false)
            }}
            className="p-1 text-[#0E2538]/35 hover:text-[#0E2538]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAndroidInstall ? (
          <>
            <p className="text-xs text-[#0E2538]/70 leading-relaxed mb-4">
              Install smono for faster launch, full-screen experience, and reliable reminders.
            </p>
            <button
              type="button"
              onClick={handleInstallAndroid}
              className="w-full py-3 rounded-xl bg-[#3F8DD2] text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Install app
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
              onClick={() => {
                markDismissed(INSTALL_DISMISS_KEY)
                setShowInstall(false)
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#3F8DD2] text-white text-xs font-bold"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  )
}
