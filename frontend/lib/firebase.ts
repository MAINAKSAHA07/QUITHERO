/**
 * Shared Firebase app — Analytics + future Auth / Messaging / etc.
 * Web config is public (restricted by Firebase console domain rules).
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'smono-54134.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smono-54134',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'smono-54134.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '969689528370',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:969689528370:web:1158185fb363228b03242b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-H4ZFZ7N46P',
}

export function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig)
}

let analyticsInit: Promise<Analytics | null> | null = null

/** Browser Analytics only — null when unsupported (SSR / some WebViews). */
export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (!analyticsInit) {
    analyticsInit = (async () => {
      if (typeof window === 'undefined') return null
      try {
        if (!(await isSupported())) return null
        return getAnalytics(getFirebaseApp())
      } catch {
        return null
      }
    })()
  }
  return analyticsInit
}

export { firebaseConfig }
