import { BaseService } from './base.service'
import { ProgressStats, ProgressCalculation } from '../types/models'
import { ApiResponse } from '../types/api'
import { pb } from '../lib/pocketbase'
import { profileService } from './profile.service'
import { cravingService } from './craving.service'

export class ProgressService extends BaseService {
  constructor() {
    super('progress_stats')
  }

  /**
   * Calculate and update progress stats
   */
  async calculateProgress(userId: string): Promise<ApiResponse<ProgressCalculation>> {
    try {
      console.log('🔍 Calculating progress for user:', userId)
      
      // Fetch user profile
      const profile = await profileService.getByUserId(userId)
      if (!profile.success || !profile.data) {
        console.warn('⚠️ User profile not found for user:', userId)
        // Return default values if profile doesn't exist yet
        const defaultCalculation: ProgressCalculation = {
          days_smoke_free: 0,
          cigarettes_not_smoked: 0,
          money_saved: 0,
          life_regained_hours: 0,
          nicotine_not_consumed: 0,
          cigarettes_smoked: 0,
        }
        return { success: true, data: defaultCalculation }
      }

      const userProfile = profile.data
      console.log('👤 User profile:', {
        quit_date: userProfile.quit_date,
        daily_consumption: userProfile.daily_consumption
      })
      
      // If quit_date is not set, return default values
      if (!userProfile.quit_date) {
        console.warn('⚠️ User has no quit_date set. Progress will be 0.')
        const defaultCalculation: ProgressCalculation = {
          days_smoke_free: 0,
          cigarettes_not_smoked: 0,
          money_saved: 0,
          life_regained_hours: 0,
          nicotine_not_consumed: 0,
          cigarettes_smoked: 0,
        }
        // Still update the stats with defaults
        await this.upsertProgressStats(userId, defaultCalculation)
        return { success: true, data: defaultCalculation }
      }

      const quitDate = new Date(userProfile.quit_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Calculate days smoke-free
      const daysSmokeFree = Math.max(0, Math.floor((today.getTime() - quitDate.getTime()) / (1000 * 60 * 60 * 24)))
      console.log('📅 Days smoke-free calculated:', daysSmokeFree, 'from quit_date:', userProfile.quit_date)

      // Fetch slips (cravings with type = 'slip')
      const slipsResult = await cravingService.getCountByType(userId, 'slip')
      const cigarettesSmoked = slipsResult.success ? (slipsResult.data || 0) : 0
      console.log('🚬 Cigarettes smoked (slips):', cigarettesSmoked)

      // Calculate cigarettes not smoked
      const dailyConsumption = userProfile.daily_consumption || 0
      console.log('📊 Daily consumption:', dailyConsumption)
      const cigarettesNotSmoked = Math.max(0, daysSmokeFree * dailyConsumption - cigarettesSmoked)
      console.log('💨 Cigarettes not smoked:', cigarettesNotSmoked, '(days:', daysSmokeFree, '× daily:', dailyConsumption, '- smoked:', cigarettesSmoked, ')')

      // Calculate money saved (assuming ₹8 per cigarette, can be configurable)
      const pricePerCigarette = 8
      const moneySaved = cigarettesNotSmoked * pricePerCigarette
      console.log('💰 Money saved:', moneySaved)

      // Calculate life regained (11 minutes per cigarette)
      const lifeRegainedHours = (cigarettesNotSmoked * 11) / 60

      // Calculate nicotine not consumed (assuming 0.8mg per cigarette)
      const nicotinePerCigarette = 0.8
      const nicotineNotConsumed = cigarettesNotSmoked * nicotinePerCigarette
      console.log('💧 Nicotine not consumed:', nicotineNotConsumed, 'mg')

      const calculation: ProgressCalculation = {
        days_smoke_free: daysSmokeFree,
        cigarettes_not_smoked: cigarettesNotSmoked,
        money_saved: moneySaved,
        life_regained_hours: lifeRegainedHours,
        nicotine_not_consumed: nicotineNotConsumed,
        cigarettes_smoked: cigarettesSmoked,
      }

      console.log('✅ Final calculation:', calculation)

      // Update or create progress_stats record
      await this.upsertProgressStats(userId, calculation)

      return { success: true, data: calculation }
    } catch (error: any) {
      console.error('❌ Error calculating progress:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get progress stats for user
   */
  async getByUserId(userId: string): Promise<ApiResponse<ProgressStats>> {
    try {
      const result = await pb.collection(this.collectionName).getFirstListItem(`user = "${userId}"`)
      return { success: true, data: result }
    } catch (error: any) {
      if (error.status === 404) {
        // No stats yet, return default
        return {
          success: true,
          data: {
            user: userId,
            days_smoke_free: 0,
            cigarettes_not_smoked: 0,
            money_saved: 0,
            life_regained_hours: 0,
            health_improvement_percent: 0,
          } as ProgressStats,
        }
      }
      return { success: false, error: error.message }
    }
  }

  /**
   * Upsert progress stats
   */
  private async upsertProgressStats(
    userId: string,
    calculation: ProgressCalculation
  ): Promise<ApiResponse<ProgressStats>> {
    try {
      const existing = await this.getByUserId(userId)

      const statsData: Partial<ProgressStats> = {
        days_smoke_free: calculation.days_smoke_free,
        cigarettes_not_smoked: calculation.cigarettes_not_smoked,
        money_saved: calculation.money_saved,
        life_regained_hours: calculation.life_regained_hours,
        last_calculated: new Date().toISOString(),
      }

      if (existing.success && existing.data && existing.data.id) {
        // Update existing
        return await this.update(existing.data.id, statsData)
      } else {
        // Create new
        return await this.create({
          ...statsData,
          user: userId,
        })
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Refresh progress stats (recalculate)
   */
  async refresh(userId: string): Promise<ApiResponse<ProgressCalculation>> {
    return await this.calculateProgress(userId)
  }
}

export const progressService = new ProgressService()

