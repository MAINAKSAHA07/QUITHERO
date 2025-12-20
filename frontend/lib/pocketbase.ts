import PocketBase from 'pocketbase'

// In production (Vercel), use the serverless proxy to avoid Mixed Content errors
// In development, connect directly to PocketBase
const PB_URL = import.meta.env.PROD
  ? '/api/pocketbase'  // Use Vercel proxy in production
  : import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8096'

export const pb = new PocketBase(PB_URL)

// Always log the URL to help debug deployment issues
console.log('[Frontend] PocketBase URL:', PB_URL)
if (!import.meta.env.PROD && !import.meta.env.VITE_POCKETBASE_URL) {
  console.warn('[Frontend] ⚠️ WARNING: Using default localhost URL. Set VITE_POCKETBASE_URL in environment variables!')
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
      console.error('User registration failed:', error)
      
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
      console.error('User login failed:', error)
      
      // Extract more detailed error information from PocketBase ClientResponseError
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

export default pb

