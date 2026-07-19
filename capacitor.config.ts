/**
 * Capacitor shell for Smono.
 * Bundled SPA in webDir; API calls use getApiOrigin() on native only (web unchanged).
 */
const config = {
  appId: 'app.smono.quit',
  appName: 'Smono',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow Universal Links / OAuth return hosts inside the WebView
    allowNavigation: ['app.smono.app', 'www.smono.app', '*.apple.com', 'accounts.google.com'],
  },
  ios: {
    // never = full-bleed WebView; CSS env(safe-area-*) handles notches
    // automatic fought our safe-area padding and letterboxed the UI
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#F4F8FA',
      showSpinner: false,
    },
    StatusBar: {
      // Light UI → dark status icons; overlay so safe-area insets apply in CSS
      style: 'LIGHT',
      backgroundColor: '#F4F8FA',
      overlaysWebView: true,
    },
    Keyboard: {
      // body reflow janks WKWebView; native uses UIKit inset adjustment
      resize: 'native',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
