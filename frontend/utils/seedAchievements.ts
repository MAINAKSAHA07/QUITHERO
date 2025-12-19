/**
 * Utility script to seed achievements in PocketBase
 * Run this once to populate the achievements collection
 */
import { achievementService } from '../services/achievement.service'

export async function seedAchievements() {
  try {
    const result = await achievementService.seedAchievements()
    if (result.success) {
      console.log('✅ Achievements seeded successfully')
      return true
    } else {
      console.error('❌ Failed to seed achievements:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Error seeding achievements:', error)
    return false
  }
}

// If running directly (for testing)
if (typeof window !== 'undefined') {
  (window as any).seedAchievements = seedAchievements
}

