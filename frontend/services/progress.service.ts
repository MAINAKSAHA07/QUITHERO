import { BaseService } from './base.service'
import { ProgressStats, ProgressCalculation } from '../types/models'
import { ApiResponse } from '../types/api'
import { pb } from '../lib/pocketbase'
import { profileService } from './profile.service'
import { cravingService } from './craving.service'
import { smokeCheckService, SmokeCheckService } from './smoke-check.service'
import { getCountryConfig } from '../utils/currency'
import { isPastQuitDay } from '../utils/smokeCheckTiming'

export class ProgressService extends BaseService {
  constructor() {
    super('progress_stats')
  }

  /**
   * Calculate and update progress stats
   */
  async calculateProgress(userId: string): Promise<ApiResponse<ProgressCalculation>> {
    try {
      const [profile, slipsResult, resistedResult, aggResult] = await Promise.all([
        profileService.getByUserId(userId),
        cravingService.getCountByType(userId, 'slip'),
        cravingService.getCountByType(userId, 'craving'),
        smokeCheckService.getAggregatedStats(userId),
      ])

      if (!profile.success || !profile.data) {
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
      
      // If quit_date is not set, return default values
      if (!userProfile.quit_date) {
        const defaultCalculation: ProgressCalculation = {
          days_smoke_free: 0,
          cigarettes_not_smoked: 0,
          money_saved: 0,
          life_regained_hours: 0,
          nicotine_not_consumed: 0,
          cigarettes_smoked: 0,
        }
        // Still update the stats with defaults in the background
        this.upsertProgressStats(userId, defaultCalculation).catch(() => {})
        return { success: true, data: defaultCalculation }
      }

      const countryConfig = getCountryConfig(userProfile.country)
      const dailyConsumption = userProfile.daily_consumption || 0
      const cigarettesSmoked = slipsResult.success ? slipsResult.data || 0 : 0
      const cravingsResisted = resistedResult.success ? resistedResult.data || 0 : 0
      const smokeFreePeriods = aggResult.success ? aggResult.data?.totalPeriods || 0 : 0
      const currentStreakDays = aggResult.success ? aggResult.data?.currentStreakDays || 0 : 0
      const postQuit = isPastQuitDay(userProfile.quit_date)

      let daysSmokeFree: number
      let cigarettesNotSmoked: number
      let moneySaved: number
      let nicotineNotConsumed: number

      if (postQuit) {
        const fromChecks = SmokeCheckService.statsFromPeriods(smokeFreePeriods, dailyConsumption)
        // ponytail: use the larger verified signal so resisted cravings count without
        // double-counting them on top of check-in estimates; slips remain visible separately.
        daysSmokeFree = fromChecks.daysSmokeFree
        cigarettesNotSmoked = Math.max(fromChecks.cigarettesNotSmoked, cravingsResisted)
        moneySaved = cigarettesNotSmoked * countryConfig.pricePerCigarette
        nicotineNotConsumed = cigarettesNotSmoked * countryConfig.nicotinePerCigarette
      } else {
        daysSmokeFree = 0
        cigarettesNotSmoked = cravingsResisted
        moneySaved = cravingsResisted * countryConfig.pricePerCigarette
        nicotineNotConsumed = cravingsResisted * countryConfig.nicotinePerCigarette
      }

      // Life regained: 11 minutes per cigarette not smoked
      const lifeRegainedHours = (cigarettesNotSmoked * 11) / 60

      const calculation: ProgressCalculation = {
        days_smoke_free: daysSmokeFree,
        cigarettes_not_smoked: cigarettesNotSmoked,
        money_saved: moneySaved,
        life_regained_hours: lifeRegainedHours,
        nicotine_not_consumed: nicotineNotConsumed,
        cigarettes_smoked: cigarettesSmoked,
        smoke_free_periods: smokeFreePeriods,
        current_streak_days: currentStreakDays,
      }

      // Update or create progress_stats record in the background to avoid blocking the main thread
      this.upsertProgressStats(userId, calculation).catch(() => {})

      return { success: true, data: calculation }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get progress stats for user
   */
  async getByUserId(userId: string): Promise<ApiResponse<ProgressStats>> {
    try {
      const result = await pb.collection(this.collectionName).getFirstListItem(`user = "${userId}"`)
      return { success: true, data: result as any as ProgressStats }
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
        nicotine_not_consumed: calculation.nicotine_not_consumed,
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

