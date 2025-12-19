import { useState, useEffect, useCallback } from 'react'
import { progressService } from '../services/progress.service'
import { ProgressStats, ProgressCalculation } from '../types/models'
import { useApp } from '../context/AppContext'

export function useProgress() {
  const { user } = useApp()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [calculation, setCalculation] = useState<ProgressCalculation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const result = await progressService.getByUserId(user.id)
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        setError(result.error || 'Failed to fetch stats')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const calculateProgress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return { success: false, error: 'User not found' }
    }

    setLoading(true)
    setError(null)
    try {
      const result = await progressService.calculateProgress(user.id)
      if (result.success && result.data) {
        setCalculation(result.data)
        // Also fetch updated stats
        await fetchStats()
        setLoading(false)
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to calculate progress')
        setLoading(false)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      return { success: false, error: err.message }
    }
  }, [user?.id, fetchStats])

  const refresh = useCallback(async () => {
    return await calculateProgress()
  }, [calculateProgress])

  useEffect(() => {
    if (user?.id) {
      // Only fetch stats on mount, don't calculate progress automatically
      // Progress calculation should be triggered manually or after data changes
      fetchStats()
    }
  }, [user?.id])

  return {
    stats,
    calculation,
    loading,
    error,
    fetchStats,
    calculateProgress,
    refresh,
  }
}
