import { useState, useEffect } from 'react'
import { Share, PlusSquare, X, Bell, Download } from 'lucide-react'
import { enablePushWithFeedback } from '../utils/pushNotifications'
import {
  isIosDevice,
  isStandalonePwa,
  wasDismissedRecently,
  markDismissed,
  INSTALL_DISMISS_KEY,
  NOTIF_DISMISS_KEY,
} from '../utils/pwa'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [showInstall, setShowInstall] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isAndroidInstall, setIsAndroidInstall] = useState(false)

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
        setTimeout(() => setShowInstall(true), 1500)
      }
    }
    window.addEventListener('beforeinstallprompt', onBip)

    const ios = isIosDevice()
    const standalone = isStandalonePwa()

    if (standalone && 'Notification' in window) {
      if (
        Notification.permission === 'default' &&
        !wasDismissedRecently(NOTIF_DISMISS_KEY)
      ) {
        const t = setTimeout(() => setShowNotif(true), 2000)
        return () => {
          clearTimeout(t)
          window.removeEventListener('beforeinstallprompt', onBip)
        }
      }
    } else if (ios && !standalone && !wasDismissedRecently(INSTALL_DISMISS_KEY)) {
      const t = setTimeout(() => setShowInstall(true), 1500)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onBip)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

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
    markDismissed(NOTIF_DISMISS_KEY)
  }

  if (showNotif) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in max-w-md mx-auto">
        <div className="glass rounded-2xl p-5 border border-brand-primary/20 shadow-glass-md">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <img src="/mascot.png" alt="" className="w-10 h-10 rounded-xl" />
              <div>
                <h4 className="font-bold text-text-primary text-sm">Enable reminders</h4>
                <p className="text-[10px] text-text-primary/50 font-medium">Daily check-ins & session alerts</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                markDismissed(NOTIF_DISMISS_KEY)
                setShowNotif(false)
              }}
              className="p-1 text-text-primary/40 hover:text-text-primary"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-text-primary/75 leading-relaxed mb-4">
            Get gentle nudges for your daily session and quit milestones — even when the app is in the background.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                markDismissed(NOTIF_DISMISS_KEY)
                setShowNotif(false)
              }}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-primary/60"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" /> Enable
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in max-w-md mx-auto">
      <div className="glass rounded-2xl p-5 border border-brand-primary/20 shadow-glass-md">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img src="/mascot.png" alt="" className="w-10 h-10 rounded-xl" />
            <div>
              <h4 className="font-bold text-text-primary text-sm">Add smono to Home Screen</h4>
              <p className="text-[10px] text-text-primary/50 font-medium">App-like access, one tap away</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              markDismissed(INSTALL_DISMISS_KEY)
              setShowInstall(false)
            }}
            className="p-1 text-text-primary/40 hover:text-text-primary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAndroidInstall ? (
          <>
            <p className="text-xs text-text-primary/75 leading-relaxed mb-4">
              Install smono for faster launch, full-screen experience, and reliable reminders.
            </p>
            <button
              type="button"
              onClick={handleInstallAndroid}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Install app
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-text-primary/75 leading-relaxed mb-4">
              Add smono to your home screen for standalone access and lock-screen reminders on iPhone.
            </p>
            <div className="space-y-3 border-t border-white/10 pt-3 text-xs text-text-primary/80">
              <div className="flex items-center gap-3">
                <Share className="w-4 h-4 text-brand-primary shrink-0" />
                <span>
                  1. Tap <strong className="text-brand-primary">Share</strong> in Safari
                </span>
              </div>
              <div className="flex items-center gap-3">
                <PlusSquare className="w-4 h-4 text-brand-primary shrink-0" />
                <span>
                  2. Choose <strong className="text-brand-primary">Add to Home Screen</strong>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                markDismissed(INSTALL_DISMISS_KEY)
                setShowInstall(false)
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  )
}
