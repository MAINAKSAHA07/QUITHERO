import PocketBase from 'pocketbase'

// In production (Vercel), use the serverless proxy to avoid Mixed Content errors
// In development, connect directly to PocketBase
const PB_URL = import.meta.env.PROD
  ? '/api/pocketbase'  // Use Vercel proxy in production
  : import.meta.env.VITE_POCKETBASE_URL ||
    import.meta.env.VITE_BACKOFFICE_PB_URL ||
    'http://localhost:8096'

export const pb = new PocketBase(PB_URL)

// Always log the URL to help debug deployment issues
console.log('[Backoffice] PocketBase URL:', PB_URL)
console.log('[Backoffice] Environment check:', {
  VITE_POCKETBASE_URL: import.meta.env.VITE_POCKETBASE_URL || 'NOT SET',
  VITE_BACKOFFICE_PB_URL: import.meta.env.VITE_BACKOFFICE_PB_URL || 'NOT SET',
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD
})
if (!import.meta.env.VITE_POCKETBASE_URL && !import.meta.env.VITE_BACKOFFICE_PB_URL) {
  console.error('[Backoffice] ❌ ERROR: VITE_POCKETBASE_URL is not set!')
  console.error('[Backoffice] ⚠️ Using default localhost URL. This will NOT work in production!')
  console.error('[Backoffice] 📝 Fix: Set VITE_POCKETBASE_URL=http://54.153.95.239:8096 in Vercel environment variables and redeploy!')
}

// Enable auto cancellation for all pending requests
pb.autoCancellation(false)

// Admin auth helpers (custom auth collection: admin_users)
export const adminAuthHelpers = {
  async login(email: string, password: string) {
    try {
      const result = await pb.collection('admin_users').authWithPassword(email, password)
      return { success: true, data: result }
    } catch (error: any) {
      console.error('Admin login failed:', error)
      return { success: false, error: error?.message || 'Login failed' }
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

// Admin collection helpers for backoffice
export const adminCollectionHelpers = {
  /**
   * Get full list of records (no pagination)
   */
  async getFullList(collectionName: string, options?: {
    filter?: string
    sort?: string
    expand?: string
    fields?: string
  }) {
    try {
      const records = await pb.collection(collectionName).getFullList({
        filter: options?.filter,
        sort: options?.sort,
        expand: options?.expand,
        fields: options?.fields,
      })
      return { success: true, data: records }
    } catch (error: any) {
      console.error(`Error fetching ${collectionName}:`, error)
      return { success: false, error: error.message, data: [] }
    }
  },

  /**
   * Get paginated list of records
   */
  async getList(collectionName: string, page: number = 1, perPage: number = 30, options?: {
    filter?: string
    sort?: string
    expand?: string
    fields?: string
  }) {
    try {
      const result = await pb.collection(collectionName).getList(page, perPage, {
        filter: options?.filter,
        sort: options?.sort,
        expand: options?.expand,
        fields: options?.fields,
      })
      // Return the full result so callers can access items/total from data
      return { success: true, data: result }
    } catch (error: any) {
      console.error(`Error fetching ${collectionName}:`, error)
      return { success: false, error: error.message, data: [], totalItems: 0, totalPages: 0 }
    }
  },

  /**
   * Get single record by ID
   */
  async getOne(collectionName: string, id: string, options?: {
    expand?: string
    fields?: string
  }) {
    try {
      const record = await pb.collection(collectionName).getOne(id, {
        expand: options?.expand,
        fields: options?.fields,
      })
      return { success: true, data: record }
    } catch (error: any) {
      console.error(`Error fetching ${collectionName}/${id}:`, error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Create a new record
   */
  async create(collectionName: string, data: any) {
    try {
      const record = await pb.collection(collectionName).create(data)
      return { success: true, data: record }
    } catch (error: any) {
      console.error(`Error creating ${collectionName}:`, error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update a record
   */
  async update(collectionName: string, id: string, data: any) {
    try {
      const record = await pb.collection(collectionName).update(id, data)
      return { success: true, data: record }
    } catch (error: any) {
      console.error(`Error updating ${collectionName}/${id}:`, error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete a record
   */
  async delete(collectionName: string, id: string) {
    try {
      await pb.collection(collectionName).delete(id)
      return { success: true }
    } catch (error: any) {
      console.error(`Error deleting ${collectionName}/${id}:`, error)
      // Extract more detailed error information
      const errorMessage = error?.response?.message || error?.message || error?.data?.message || 'Unknown error'
      const errorStatus = error?.status || error?.response?.status
      return { 
        success: false, 
        error: errorMessage,
        status: errorStatus,
      }
    }
  },

  /**
   * Get first item matching filter
   */
  async getFirst(collectionName: string, filter: string, options?: {
    expand?: string
    sort?: string
  }) {
    try {
      const record = await pb.collection(collectionName).getFirstListItem(filter, {
        expand: options?.expand,
        sort: options?.sort,
      })
      return { success: true, data: record }
    } catch (error: any) {
      console.error(`Error fetching first ${collectionName}:`, error)
      return { success: false, error: error.message }
    }
  },
}

export default pb
