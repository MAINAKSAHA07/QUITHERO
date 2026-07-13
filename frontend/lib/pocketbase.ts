import PocketBase from 'pocketbase'
import {
  buildOAuthStartUrl,
  getOAuthBaseUrl,
  getOAuthRedirectUrl,
  stashOAuthSession,
  type OAuthProvider,
} from './oauth'

// In production (Vercel), use the serverless proxy to avoid Mixed Content errors
// In development, connect directly to PocketBase
const PB_URL = import.meta.env.PROD
  ? '/api/pocketbase'  // Use Vercel proxy in production
  : import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8096'

export const pb = new PocketBase(PB_URL)

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

// Base collections were created without system date fields; only `users` supports `-created`.
export const recentSort = (collection: string) =>
  collection === 'users' ? '-created' : '-id'

if (import.meta.env.DEV) {
  console.log('[Frontend] PocketBase URL:', PB_URL)
}

// Enable auto cancellation for all pending requests
pb.autoCancellation(false)

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
      
      // Extract detailed error information
      let errorMessage = 'Registration failed'
      
      if (error?.status && error?.data) {
        const data = error.data
        if (data.email && typeof data.email === 'object' && data.email.message) {
          errorMessage = data.email.message
        } else if (data.password && typeof data.password === 'object' && data.password.message) {
          errorMessage = data.password.message
        } else if (data.message) {
          errorMessage = data.message
        } else if (typeof data === 'string') {
          errorMessage = data
        } else if (error.message) {
          errorMessage = error.message
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      return { success: false, error: errorMessage }
    }
  },
  async login(email: string, password: string) {
    try {
      const result = await pb.collection('users').authWithPassword(email, password)
      return { success: true, data: result }
    } catch (error: any) {
      let errorMessage = 'Login failed'
      
      // PocketBase ClientResponseError has a specific structure
      // Check if it's a ClientResponseError (has status, data, response properties)
      if (error?.status && error?.data) {
        const data = error.data
        
        // Check for field-specific errors (common PocketBase error format)
        if (data.email && typeof data.email === 'object' && data.email.message) {
          errorMessage = data.email.message
        } else if (data.password && typeof data.password === 'object' && data.password.message) {
          errorMessage = data.password.message
        } else if (data.message) {
          errorMessage = data.message
        } else if (typeof data === 'string') {
          errorMessage = data
        } else if (data.code) {
          errorMessage = data.code
        }
        
        // Use the error message if available and we haven't found a specific message
        if (error.message && errorMessage === 'Login failed') {
          errorMessage = error.message
        }
      } else if (error?.response) {
        // Fallback for other error types
        const responseData = error.response
        if (responseData.data) {
          errorMessage = responseData.data.message || responseData.data || errorMessage
        } else if (responseData.message) {
          errorMessage = responseData.message
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      // Provide user-friendly messages for common errors
      if (errorMessage.includes('Failed to authenticate') || 
          errorMessage.includes('Invalid login') ||
          errorMessage.includes('400') ||
          error?.status === 400) {
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
        (p: OAuthProvider) => p.name === 'google'
      ) as OAuthProvider | undefined
      if (!provider) {
        throw new Error('Google sign-in is not enabled on the server.')
      }

      const redirectURL = getOAuthRedirectUrl(oauthBaseUrl)

      // Production proxies (Netlify/nginx) cannot stream PocketBase realtime/SSE.
      // Use full-page redirect + oauth-callback.html instead of authWithOAuth2 popup.
      if (import.meta.env.PROD) {
        stashOAuthSession(provider, redirectURL)
        window.location.href = buildOAuthStartUrl(provider, redirectURL)
        return { success: true, data: null, redirecting: true as const }
      }

      const result = await pb.collection('users').authWithOAuth2({
        provider: 'google',
        url: oauthBaseUrl,
      })
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message || 'Google authentication failed' }
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

let lastActiveTouch = 0

/** Throttled heartbeat — updates users.lastActive for backoffice analytics */
export async function touchLastActive() {
  if (!pb.authStore.isValid) return
  const now = Date.now()
  if (now - lastActiveTouch < 15 * 60 * 1000) return
  lastActiveTouch = now
  const id = pb.authStore.record?.id
  if (!id) return
  try {
    await pb.collection('users').update(id, { lastActive: new Date().toISOString() })
  } catch {
    // ponytail: no-op if field missing on unmigrated server
  }
}

export default pb

