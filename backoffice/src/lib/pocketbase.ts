import PocketBase from 'pocketbase'

// Dev + prod: same-origin proxy avoids CORS and wrong localhost defaults
const PB_URL = '/api/pocketbase'

export const pb = new PocketBase(PB_URL)

// Base collections were created without system date fields; only `users` supports `-created`.
export const recentSort = (collection: string) =>
  collection === 'users' ? '-created' : '-id'

if (import.meta.env.DEV) {
  console.log('[Backoffice] PocketBase URL:', PB_URL)
}

pb.autoCancellation(false)

// ponytail: belt-and-suspenders — SDK should attach token, but proxy setups have dropped it before
pb.beforeSend = (url, options) => {
  const token = pb.authStore.token
  if (token) {
    options.headers = { ...options.headers, Authorization: token }
  }
  return { url, options }
}

function assertAuthed() {
  if (!pb.authStore.isValid) {
    throw new Error('Session expired — please sign in again')
  }
}

function pbErrorMessage(error: unknown): string {
  const err = error as { message?: string; response?: { data?: Record<string, unknown> }; data?: Record<string, unknown> }
  const data = err?.response?.data ?? err?.data
  if (data && typeof data === 'object') {
    const parts = Object.entries(data).map(([key, val]) => {
      if (val && typeof val === 'object' && 'message' in val) {
        return `${key}: ${(val as { message: string }).message}`
      }
      return `${key}: ${String(val)}`
    })
    if (parts.length) return parts.join('; ')
  }
  return err?.message || 'Request failed'
}

async function fetchFullList(
  collectionName: string,
  options?: { filter?: string; sort?: string; expand?: string; fields?: string }
) {
  assertAuthed()
  const records = await pb.collection(collectionName).getFullList({
    filter: options?.filter,
    sort: options?.sort,
    expand: options?.expand,
    fields: options?.fields,
    batch: 200,
  })
  return { success: true as const, data: records }
}

async function fetchList(
  collectionName: string,
  page: number,
  perPage: number,
  options?: { filter?: string; sort?: string; expand?: string; fields?: string }
) {
  assertAuthed()
  const result = await pb.collection(collectionName).getList(page, perPage, {
    filter: options?.filter,
    sort: options?.sort,
    expand: options?.expand,
    fields: options?.fields,
    skipTotal: false,
  })
  return { success: true as const, data: result }
}

// Admin auth helpers (custom auth collection: admin_users)
export const adminAuthHelpers = {
  async login(email: string, password: string) {
    try {
      const result = await pb.collection('admin_users').authWithPassword(email, password)
      if (!pb.authStore.isValid) {
        return { success: false, error: 'Login succeeded but session was not saved. Try again.' }
      }
      return { success: true, data: result }
    } catch (error: any) {
      const msg = error?.message || 'Login failed'
      if (msg.includes('Failed to authenticate')) {
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.',
        }
      }
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return {
          success: false,
          error: 'Cannot reach PocketBase. Start the dev server (npm run dev) — it proxies /api/pocketbase to your server.',
        }
      }
      return { success: false, error: msg }
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
      return await fetchFullList(collectionName, options)
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) pb.authStore.clear()
      return { success: false, error: error.message, data: [] as never[] }
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
      return await fetchList(collectionName, page, perPage, options)
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) pb.authStore.clear()
      return { success: false, error: error.message, data: { items: [], page: 1, perPage, totalItems: 0, totalPages: 0 } }
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
      return { success: false, error: error.message }
    }
  },

  /**
   * Create a new record
   */
  async create(collectionName: string, data: Record<string, unknown> | FormData) {
    try {
      assertAuthed()
      const record = await pb.collection(collectionName).create(data)
      return { success: true, data: record }
    } catch (error: unknown) {
      if ((error as { status?: number })?.status === 401 || (error as { status?: number })?.status === 403) {
        pb.authStore.clear()
      }
      return { success: false, error: pbErrorMessage(error) }
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
      return { success: false, error: error.message }
    }
  },
}

export default pb
