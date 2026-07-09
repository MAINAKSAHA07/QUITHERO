import { BaseService } from './base.service'
import { UserProfile } from '../types/models'
import { ApiResponse } from '../types/api'

export class ProfileService extends BaseService {
  constructor() {
    super('user_profiles')
  }

  /**
   * Get user profile by user ID
   */
  async getByUserId(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const result = await this.getFirst(`user = "${userId}"`, {
        expand: 'user',
      })
      return result
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Create or update user profile
   */
  async upsert(userId: string, data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      // Try to get existing profile
      const existing = await this.getByUserId(userId)

      if (existing.success && existing.data) {
        // Update existing - ensure user field is included
        const updateData = { ...data }
        // Don't overwrite user field if it's already set
        if (!updateData.user) {
          updateData.user = userId
        }
        return await this.update(existing.data.id!, updateData)
      } else {
        // Create new — quit_date required; syncQuitDateWithSessions keeps it aligned with session pace
        const today = new Date().toISOString().split('T')[0]
        const createData: any = {
          ...data,
          user: userId,
          // Set default language if not provided (required field)
          language: data.language || 'en',
          quit_date: data.quit_date || today,
        }
        return await this.create(createData)
      }
    } catch (error: any) {
      // Extract detailed error information
      const errorData = error.response?.data || error.data || {}
      
      // Handle quit_date validation error specifically
      if (errorData.quit_date) {
        const quitDateError = errorData.quit_date.message || 'invalid'
        return { 
          success: false, 
          error: `Quit date is required: ${quitDateError}` 
        }
      }
      
      const errorMessage = errorData.message || error.message || 'An error occurred'
      return { 
        success: false, 
        error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage) 
      }
    }
  }

  /**
   * Update profile fields (partial update)
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    const profile = await this.getByUserId(userId)
    if (!profile.success || !profile.data) {
      return { success: false, error: 'Profile not found' }
    }

    return await this.update(profile.data.id!, updates)
  }
}

export const profileService = new ProfileService()

