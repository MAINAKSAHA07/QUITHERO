import PocketBase, { AsyncAuthStore } from 'pocketbase'
import { Capacitor } from '@capacitor/core'
import {
  buildOAuthStartUrl,
  getOAuthBaseUrl,
  getOAuthRedirectUrl,
  stashOAuthSession,
  type OAuthProvider,
} from './oauth'
import { getPocketBaseUrl } from '../utils/apiOrigin'

const AUTH_KEY = 'pocketbase_auth'

const PB_URL = getPocketBaseUrl()

/**
 * Web: default LocalAuthStore (localStorage) — unchanged.
 * Native: Capacitor Preferences (Keychain / EncryptedSharedPreferences).
 */
function createAuthStore() {
  if (!Capacitor.isNativePlatform()) return undefined

  return new AsyncAuthStore({
    save: async (serialized) => {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: AUTH_KEY, value: serialized })
    },
    clear: async () => {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key: AUTH_KEY })
    },
    initial: (async () => {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key: AUTH_KEY })
      return value
    })(),
  })
}

export const pb = new PocketBase(PB_URL, createAuthStore())

/** Call early on native boot if Capacitor was late — ensure absolute API host. */
export function ensureNativePocketBaseUrl() {
  if (!Capacitor.isNativePlatform()) return
  const url = getPocketBaseUrl()
  if (pb.baseUrl !== url) {
    pb.baseUrl = url
  }
}

export type AppUser = {
  id: string
  email: string
  name: string
  avatar: string
  created?: string
}

/** Map PocketBase auth record → app user (preserves registration date for Joined display) */
export function mapAuthRecordToAppUser(record: Record<string, unknown> | null | undefined): AppUser | null {
  if (!record?.id) return null
  return {
    id: String(record.id),
    email: String(record.email ?? ''),
    name: String(record.name || record.email || ''),
    avatar: String(record.avatar ?? ''),
    created: typeof record.created === 'string' ? record.created : undefined,
  }
}

// Most base collections were created without autodate; list those that have created.
const HAS_CREATED = new Set([
  'users',
  'cravings',
  'account_deletion_requests',
  'support_tickets',
  'support_ticket_messages',
])
export const recentSort = (collection: string) =>
  HAS_CREATED.has(collection) ? '-created' : '-id'

if (import.meta.env.DEV) {
  console.log('[Frontend] PocketBase URL:', PB_URL)
}

// Enable auto cancellation for all pending requests
pb.autoCancellation(false)

/** PocketBase puts field errors at error.data.data.<field>.message */
function formatAuthError(error: any, fallback: string): string {
  const fields = error?.data?.data
  if (fields && typeof fields === 'object') {
    for (const key of ['email', 'password', 'passwordConfirm', 'name']) {
      const msg = fields[key]?.message
      if (typeof msg === 'string' && msg) {
        if (fields[key]?.code === 'validation_not_unique' || /already|unique/i.test(msg)) {
          return 'An account with this email already exists. Try logging in instead.'
        }
        if (key === 'password' && /at least \d+/i.test(msg)) {
          return 'Password must be at least 8 characters.'
        }
        return msg
      }
    }
    const first = Object.values(fields).find(
      (f: any) => f && typeof f === 'object' && typeof f.message === 'string'
    ) as { message?: string } | undefined
    if (first?.message) return first.message
  }
  if (typeof error?.data?.message === 'string' && error.data.message) return error.data.message
  if (typeof error?.message === 'string' && error.message) return error.message
  return fallback
}

// Auth helpers for frontend users
export const authHelpers = {
  async register(email: string, password: string, data: Record<string, any> = {}) {
    try {
      const record = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        ...data,
      })
      // auto login after register
      await pb.collection('users').authWithPassword(email, password)
      return { success: true, data: { record } }
    } catch (error: any) {
      return { success: false, error: formatAuthError(error, 'Registration failed') }
    }
  },
  async login(email: string, password: string) {
    try {
      const result = await pb.collection('users').authWithPassword(email, password)
      return { success: true, data: result }
    } catch (error: any) {
      let errorMessage = formatAuthError(error, 'Login failed')

      // Provide user-friendly messages for common errors
      if (
        errorMessage.includes('Failed to authenticate') ||
        errorMessage.includes('Invalid login') ||
        errorMessage.includes('400') ||
        error?.status === 400
      ) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.'
      }

      // Log detailed error for debugging
      if (import.meta.env.DEV) {
        console.error('Login error details:', {
          status: error?.status,
          message: error?.message,
          data: error?.data,
          fullError: error,
        })
      }

      return { success: false, error: errorMessage }
    }
  },
  async loginWithGoogle() {
    return this.loginWithOAuthProvider('google')
  },
  async loginWithApple() {
    return this.loginWithOAuthProvider('apple')
  },
  async loginWithOAuthProvider(providerName: 'google' | 'apple') {
    try {
      const oauthBaseUrl = getOAuthBaseUrl()

      const methodsRes = await fetch(`${oauthBaseUrl}/api/collections/users/auth-methods`)
      const contentType = methodsRes.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Authentication server unreachable. The /api/pocketbase proxy may be misconfigured.'
        )
      }
      const methods = await methodsRes.json()
      const provider = methods?.oauth2?.providers?.find(
        (p: OAuthProvider) => p.name === providerName
      ) as OAuthProvider | undefined
      if (!provider) {
        throw new Error(
          providerName === 'apple'
            ? 'Apple sign-in is not enabled on the server yet.'
            : 'Google sign-in is not enabled on the server.'
        )
      }

      const redirectURL = getOAuthRedirectUrl(oauthBaseUrl)

      // Production proxies (Netlify/nginx) cannot stream PocketBase realtime/SSE.
      // Use full-page redirect + oauth-callback.html instead of authWithOAuth2 popup.
      // Native Capacitor should use ASAuthorization / Google Sign-In plugins later.
      if (import.meta.env.PROD) {
        stashOAuthSession(provider, redirectURL)
        window.location.href = buildOAuthStartUrl(provider, redirectURL)
        return { success: true, data: null, redirecting: true as const }
      }

      const result = await pb.collection('users').authWithOAuth2({
        provider: providerName,
        url: oauthBaseUrl,
      })
      return { success: true, data: result }
    } catch (error: any) {
      const label = providerName === 'apple' ? 'Apple' : 'Google'
      return { success: false, error: error.message || `${label} authentication failed` }
    }
  },
  logout() {
    pb.authStore.clear()
  },
  getCurrentUser() {
    return pb.authStore.model
  },
  isAuthenticated() {
    return pb.authStore.isValid
  },
}

// ponytail: users.lastActive removed — backoffice uses indexed app events only

export default pb
