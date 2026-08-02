/**
 * Shared Firebase app — Analytics + future Auth / Messaging / etc.
 * Config comes from env only (never hardcode keys in source).
 * Restrict HTTP referrers in Google Cloud / Firebase console.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

function env(name: keyof ImportMetaEnv): string {
  return String(import.meta.env[name] || '').trim()
}

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
  measurementId: env('VITE_FIREBASE_MEASUREMENT_ID'),
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null
  return getApps()[0] ?? initializeApp(firebaseConfig)
}

let analyticsInit: Promise<Analytics | null> | null = null

/** Browser Analytics only — null when unsupported or env missing. */
export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (!analyticsInit) {
    analyticsInit = (async () => {
      if (typeof window === 'undefined') return null
      const app = getFirebaseApp()
      if (!app) return null
      try {
        if (!(await isSupported())) return null
        return getAnalytics(app)
      } catch {
        return null
      }
    })()
  }
  return analyticsInit
}

export { firebaseConfig }
