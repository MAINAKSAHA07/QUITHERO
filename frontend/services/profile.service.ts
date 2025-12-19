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
        // Update existing
        return await this.update(existing.data.id!, { ...data, user: userId })
      } else {
        // Create new
        return await this.create({ ...data, user: userId })
      }
    } catch (error: any) {
      return this.handleError(error)
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

