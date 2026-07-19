/**
 * Same-origin on web (''). Absolute host on Capacitor so /api/* hits app.smono.app.
 * Web behavior unchanged: relative paths keep working.
 */
import { Capacitor } from '@capacitor/core'

const NATIVE_API_ORIGIN = 'https://app.smono.app'

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export function getApiOrigin(): string {
  if (!isNativePlatform()) return ''
  const fromEnv = (import.meta.env.VITE_NATIVE_API_ORIGIN as string | undefined)?.replace(/\/$/, '')
  return fromEnv || NATIVE_API_ORIGIN
}

/** Prefix path starting with / — no-op on web. */
export function apiUrl(path: string): string {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  const origin = getApiOrigin()
  if (!origin) return path
  return path.startsWith('/') ? `${origin}${path}` : `${origin}/${path}`
}

/** PocketBase base URL — always absolute on native (relative /api breaks capacitor:// origin). */
export function getPocketBaseUrl(): string {
  if (import.meta.env?.PROD) {
    return isNativePlatform() ? `${getApiOrigin()}/api/pocketbase` : '/api/pocketbase'
  }
  return import.meta.env?.VITE_POCKETBASE_URL || 'http://localhost:8096'
}
