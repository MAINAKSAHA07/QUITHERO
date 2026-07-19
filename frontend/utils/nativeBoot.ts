/**
 * Capacitor-only boot: chrome, deep links, IAP.
 * Push deferred until App ID entitlements are stable.
 * No-op on web — existing web frontend behavior unchanged.
 */
import { Capacitor } from '@capacitor/core'

type Remover = { remove: () => Promise<void> | void }

export async function bootNativeShell(): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => {}

  // Cheap CSS hook: kill backdrop-blur etc. (WKWebView tax)
  document.documentElement.classList.add('native-app')

  const cleanups: Array<() => void> = []

  // Ensure PB talks to app.smono.app (not capacitor://localhost/api/...)
  const { ensureNativePocketBaseUrl } = await import('../lib/pocketbase')
  ensureNativePocketBaseUrl()

  // Kill any PWA service worker left over from a prior web session in this WebView
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    } catch {
      /* ignore */
    }
  }

  // Dynamic import keeps StoreKit plugin out of the default web chunk path
  const { installNativeIapBridge } = await import('./nativeIap')
  installNativeIapBridge()

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: true })
    // Light app chrome → dark status bar content
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.show()
  } catch (err) {
    console.warn('[native] StatusBar unavailable', err)
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch (err) {
    console.warn('[native] SplashScreen unavailable', err)
  }

  try {
    // Faster keyboard resize on WKWebView than body reflow
    const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard')
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => undefined)
    await Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => undefined)
  } catch (err) {
    console.warn('[native] Keyboard unavailable', err)
  }

  try {
    const { App } = await import('@capacitor/app')

    const openUrl = (url: string) => {
      ;(window as unknown as { __smonoOpenUrl?: (u: string) => void }).__smonoOpenUrl?.(url)
    }

    const urlSub = (await App.addListener('appUrlOpen', (event) => {
      if (event?.url) openUrl(event.url)
    })) as Remover
    cleanups.push(() => {
      void urlSub.remove()
    })

    const launch = await App.getLaunchUrl().catch(() => undefined)
    if (launch?.url) openUrl(launch.url)

    const backSub = (await App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else void App.exitApp()
    })) as Remover
    cleanups.push(() => {
      void backSub.remove()
    })
  } catch (err) {
    console.warn('[native] App plugin unavailable', err)
  }

  // Push deferred until App ID has Push capability + matching entitlements.
  // Calling register() with mismatched signing was a likely SIGKILL source.
  try {
    console.info('[native] push registration skipped (entitlements deferred)')
  } catch {
    /* ignore */
  }

  return () => {
    for (const fn of cleanups) fn()
  }
}
