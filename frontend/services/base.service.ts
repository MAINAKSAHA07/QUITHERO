import { pb } from '../lib/pocketbase'
import { ApiResponse } from '../types/api'

/**
 * Base service class with common CRUD operations
 * All services should extend this class
 */
export class BaseService {
  protected collectionName: string

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  /**
   * Get all records
   */
  async getAll(options?: {
    filter?: string
    sort?: string
    expand?: string
    fields?: string
    limit?: number
  }): Promise<ApiResponse<any[]>> {
    try {
      const records = await pb.collection(this.collectionName).getFullList({
        ...options,
      })
      return { success: true, data: records }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get a single record by ID
   */
  async getOne(id: string, options?: { expand?: string; fields?: string }): Promise<ApiResponse<any>> {
    try {
      const record = await pb.collection(this.collectionName).getOne(id, options)
      return { success: true, data: record }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<ApiResponse<any>> {
    try {
      const record = await pb.collection(this.collectionName).create(data)
      return { success: true, data: record }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const record = await pb.collection(this.collectionName).update(id, data)
      return { success: true, data: record }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await pb.collection(this.collectionName).delete(id)
      return { success: true }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get records with pagination
   */
  async getList(
    page: number = 1,
    perPage: number = 30,
    options?: {
      filter?: string
      sort?: string
      expand?: string
      fields?: string
    }
  ): Promise<ApiResponse<any>> {
    try {
      const result = await pb.collection(this.collectionName).getList(page, perPage, options)
      return {
        success: true,
        data: {
          page: result.page,
          perPage: result.perPage,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
          items: result.items,
        },
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get first record matching filter
   */
  async getFirst(
    filter: string,
    options?: { sort?: string; expand?: string }
  ): Promise<ApiResponse<any>> {
    try {
      const record = await pb.collection(this.collectionName).getFirstListItem(filter, options)
      return { success: true, data: record }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any): ApiResponse<any> {
    const errorMessage =
      error.response?.data || error.message || 'An error occurred'
    return {
      success: false,
      error: typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage,
    }
  }
}

