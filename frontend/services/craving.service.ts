import { BaseService } from './base.service'
import { Craving } from '../types/models'
import { ApiResponse } from '../types/api'
import { pb } from '../lib/pocketbase'

export class CravingService extends BaseService {
  constructor() {
    super('cravings')
  }

  /**
   * Get user's cravings
   */
  async getByUser(
    userId: string,
    options?: {
      filter?: string
      sort?: string
      limit?: number
    }
  ): Promise<ApiResponse<Craving[]>> {
    try {
      const filter = options?.filter
        ? `user = "${userId}" && ${options.filter}`
        : `user = "${userId}"`
      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort: options?.sort || '-created',
        ...(options?.limit && { limit: options.limit }),
      })
      return { success: true, data: records || [] }
    } catch (error: any) {
      // If it's a 404, 400, or collection doesn't exist, return empty array
      if (error.status === 404 || error.status === 400 || 
          error.message?.includes('not found') || 
          error.message?.includes('No records') ||
          error.response?.data?.message?.includes('not found')) {
        return { success: true, data: [] }
      }
      // For other errors, still return empty array to prevent app breakage
      // Only log if there's a meaningful error message
      const errorMessage = error?.message || error?.response?.data?.message || ''
      if (errorMessage && errorMessage !== '{}') {
        console.warn('Error fetching cravings:', errorMessage)
      }
      return { success: true, data: [] }
    }
  }

  /**
   * Get craving trend (grouped by date)
   */
  async getTrend(userId: string, days: number = 30): Promise<ApiResponse<any[]>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]

      const cravings = await pb.collection(this.collectionName).getFullList({
        filter: `user = "${userId}" && created >= "${startDateStr}"`,
        sort: 'created',
      })

      // Group by date
      const grouped = cravings.reduce((acc: any, craving: any) => {
        const date = craving.created.split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, count: 0 }
        }
        acc[date].count++
        return acc
      }, {})

      return { success: true, data: Object.values(grouped) }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get trigger breakdown
   */
  async getTriggerBreakdown(userId: string): Promise<ApiResponse<any[]>> {
    try {
      const cravings = await this.getByUser(userId)
      if (!cravings.success || !cravings.data) {
        return { success: false, error: 'Failed to fetch cravings' }
      }

      // Count by trigger
      const breakdown = cravings.data.reduce((acc: any, craving: any) => {
        const trigger = craving.trigger || 'other'
        if (!acc[trigger]) {
          acc[trigger] = { name: trigger, value: 0 }
        }
        acc[trigger].value++
        return acc
      }, {})

      return { success: true, data: Object.values(breakdown) }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get cravings count by type
   */
  async getCountByType(userId: string, type: 'craving' | 'slip'): Promise<ApiResponse<number>> {
    try {
      const result = await this.getByUser(userId, {
        filter: `type = "${type}"`,
      })
      if (!result.success) {
        // If it's a 404 or empty result, return 0 instead of error
        const errorStr = result.error ? String(result.error) : ''
        if (errorStr.includes('404') || errorStr.includes('not found') || errorStr.includes('No records')) {
          return { success: true, data: 0 }
        }
        // For other errors, log but return 0 as fallback
        if (errorStr) {
          console.warn('Failed to fetch cravings count:', errorStr)
        }
        return { success: true, data: 0 }
      }
      return { success: true, data: result.data?.length || 0 }
    } catch (error: any) {
      // Handle errors gracefully - return 0 instead of failing
      // Check if error is an object and extract meaningful message
      const errorMessage = error?.message || error?.response?.data || error?.error || JSON.stringify(error) || 'Unknown error'
      if (errorMessage !== '{}' && errorMessage !== 'Unknown error') {
        console.warn('Error fetching cravings count:', errorMessage)
      }
      return { success: true, data: 0 }
    }
  }

  /**
   * Get recent cravings
   */
  async getRecent(userId: string, limit: number = 10): Promise<ApiResponse<Craving[]>> {
    return await this.getByUser(userId, {
      sort: '-created',
      limit,
    })
  }
}

export const cravingService = new CravingService()

