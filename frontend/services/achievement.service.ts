import { BaseService } from './base.service'
import { Achievement, UserAchievement } from '../types/models'
import { ApiResponse } from '../types/api'
import { pb } from '../lib/pocketbase'
import { progressService } from './progress.service'
import { sessionService } from './session.service'
import { cravingService } from './craving.service'

export class AchievementService extends BaseService {
  constructor() {
    super('achievements')
  }

  /**
   * Get all achievements
   */
  async getAllAchievements(): Promise<ApiResponse<Achievement[]>> {
    return await this.getAll({ sort: 'requirement_value' })
  }

  /**
   * Get user's unlocked achievements
   */
  async getUserAchievements(userId: string): Promise<ApiResponse<UserAchievement[]>> {
    try {
      const result = await pb.collection('user_achievements').getFullList({
        filter: `user = "${userId}"`,
        expand: 'achievement',
        sort: '-unlocked_at',
      })
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Check and unlock achievements for user
   */
  async checkAndUnlock(userId: string): Promise<ApiResponse<Achievement[]>> {
    try {
      // Get all achievements
      const allAchievements = await this.getAllAchievements()
      if (!allAchievements.success || !allAchievements.data) {
        return { success: false, error: 'Failed to fetch achievements' }
      }

      // Get user's unlocked achievements
      const unlocked = await this.getUserAchievements(userId)
      const unlockedKeys = unlocked.success && unlocked.data
        ? unlocked.data.map((ua: any) => ua.achievement?.key || ua.expand?.achievement?.key).filter(Boolean)
        : []

      // Get user stats
      const progress = await progressService.getByUserId(userId)
      const progressData = progress.success ? progress.data : null

      // Get cravings count (will return 0 if there's an error)
      const cravingsCount = await cravingService.getCountByType(userId, 'craving')
      const cravingsResisted = cravingsCount.success ? (cravingsCount.data || 0) : 0
      
      // If cravings count failed, continue with 0 (don't break the achievement check)
      if (!cravingsCount.success) {
        console.warn('Could not fetch cravings count for achievements, using 0')
      }

      // Get completed sessions count (simplified - would need proper query)
      // For now, use days_smoke_free as proxy

      const newlyUnlocked: Achievement[] = []

      for (const achievement of allAchievements.data) {
        // Skip if already unlocked
        if (unlockedKeys.includes(achievement.key)) {
          continue
        }

        let qualified = false

        switch (achievement.requirement_type) {
          case 'days_streak':
            if (progressData && progressData.days_smoke_free >= (achievement.requirement_value || 0)) {
              qualified = true
            }
            break

          case 'cravings_resisted':
            if (cravingsResisted >= (achievement.requirement_value || 0)) {
              qualified = true
            }
            break

          case 'sessions_completed':
            // Simplified - would need proper session count
            if (progressData && progressData.days_smoke_free >= (achievement.requirement_value || 0)) {
              qualified = true
            }
            break
        }

        if (qualified) {
          // Unlock achievement
          await pb.collection('user_achievements').create({
            user: userId,
            achievement: achievement.id,
            unlocked_at: new Date().toISOString(),
          })
          newlyUnlocked.push(achievement)
        }
      }

      return { success: true, data: newlyUnlocked }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Seed default achievements (one-time operation)
   */
  async seedAchievements(): Promise<ApiResponse<void>> {
    const achievements = [
      {
        key: 'first_day',
        title: 'First Day',
        description: 'Completed your first smoke-free day',
        tier: 'bronze',
        requirement_type: 'days_streak',
        requirement_value: 1,
      },
      {
        key: 'week_warrior',
        title: 'Week Warrior',
        description: '7 days smoke-free',
        tier: 'silver',
        requirement_type: 'days_streak',
        requirement_value: 7,
      },
      {
        key: 'month_master',
        title: 'Month Master',
        description: '30 days smoke-free',
        tier: 'gold',
        requirement_type: 'days_streak',
        requirement_value: 30,
      },
      {
        key: 'craving_crusher',
        title: 'Craving Crusher',
        description: 'Resisted 10 cravings',
        tier: 'gold',
        requirement_type: 'cravings_resisted',
        requirement_value: 10,
      },
      {
        key: 'perfect_ten',
        title: 'Perfect Ten',
        description: 'Completed all 10 days of the program',
        tier: 'platinum',
        requirement_type: 'sessions_completed',
        requirement_value: 10,
      },
    ]

    try {
      for (const achievement of achievements) {
        // Check if exists
        const existing = await pb
          .collection('achievements')
          .getFirstListItem(`key = "${achievement.key}"`)
          .catch(() => null)

        if (!existing) {
          await pb.collection('achievements').create(achievement)
        }
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const achievementService = new AchievementService()

