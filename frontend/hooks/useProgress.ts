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

  const fetchStats = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user?.id) return

    if (!opts?.silent) setLoading(true)
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
      if (!opts?.silent) setLoading(false)
    }
  }, [user?.id])

  const calculateProgress = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user?.id) {
      setLoading(false)
      return { success: false, error: 'User not found' }
    }

    const silent = opts?.silent ?? false
    if (!silent) setLoading(true)
    setError(null)
    try {
      const result = await progressService.calculateProgress(user.id)
      if (result.success && result.data) {
        setCalculation(result.data)
        await fetchStats({ silent: true })
        if (!silent) setLoading(false)
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to calculate progress')
        if (!silent) setLoading(false)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      if (!silent) setLoading(false)
      return { success: false, error: err.message }
    }
  }, [user?.id, fetchStats])

  const refresh = useCallback(async () => {
    const hasData = stats !== null || calculation !== null
    return await calculateProgress({ silent: hasData })
  }, [calculateProgress, stats, calculation])

  useEffect(() => {
    if (user?.id) fetchStats({ silent: true })
  }, [user?.id, fetchStats])

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
