import { useState, useEffect, useCallback } from 'react'
import { achievementService } from '../services/achievement.service'
import { Achievement, UserAchievement } from '../types/models'
import { useApp } from '../context/AppContext'

export function useAchievements() {
  const { user } = useApp()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAchievements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await achievementService.getAllAchievements()
      if (result.success && result.data) {
        setAchievements(result.data)
      } else {
        setError(result.error || 'Failed to fetch achievements')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserAchievements = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const result = await achievementService.getUserAchievements(user.id)
      if (result.success && result.data) {
        setUserAchievements(result.data)
      } else {
        setError(result.error || 'Failed to fetch user achievements')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const checkAndUnlock = useCallback(async () => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    try {
      const result = await achievementService.checkAndUnlock(user.id)
      if (result.success && result.data) {
        await fetchUserAchievements()
        return { success: true, data: result.data, newlyUnlocked: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user?.id, fetchUserAchievements])

  useEffect(() => {
    fetchAchievements()
    if (user?.id) {
      fetchUserAchievements()
    }
  }, [user?.id])

  const isUnlocked = useCallback((achievementKey: string): boolean => {
    const def = achievements.find((a) => a.key === achievementKey)
    return userAchievements.some((ua) => {
      const expanded = (ua as any).expand?.achievement
      if (expanded?.key === achievementKey) return true
      if (def?.id && ua.achievement === def.id) return true
      return ua.achievement === achievementKey
    })
  }, [userAchievements, achievements])

  const getUnlockedAchievements = (): Achievement[] => {
    return achievements.filter((a) => isUnlocked(a.key))
  }

  const getLockedAchievements = (): Achievement[] => {
    return achievements.filter((a) => !isUnlocked(a.key))
  }

  return {
    achievements,
    userAchievements,
    loading,
    error,
    fetchAchievements,
    fetchUserAchievements,
    checkAndUnlock,
    isUnlocked,
    getUnlockedAchievements,
    getLockedAchievements,
  }
}

