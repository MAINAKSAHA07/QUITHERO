import { useState, useEffect } from 'react'
import { progressService } from '../services/progress.service'
import { ProgressStats, ProgressCalculation } from '../types/models'
import { useApp } from '../context/AppContext'

export function useProgress() {
  const { user } = useApp()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [calculation, setCalculation] = useState<ProgressCalculation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
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
  }

  const calculateProgress = async () => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    setError(null)
    try {
      const result = await progressService.calculateProgress(user.id)
      if (result.success && result.data) {
        console.log('🔄 Progress calculation result:', result.data)
        setCalculation(result.data)
        // Also fetch updated stats
        await fetchStats()
        return { success: true, data: result.data }
      } else {
        console.error('❌ Progress calculation failed:', result.error)
        setError(result.error || 'Failed to calculate progress')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      console.error('❌ Progress calculation error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    return await calculateProgress()
  }

  useEffect(() => {
    if (user?.id) {
      fetchStats()
      calculateProgress()
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

