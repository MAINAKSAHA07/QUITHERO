import { useState, useEffect } from 'react'
import { cravingService } from '../services/craving.service'
import { Craving } from '../types/models'
import { useApp } from '../context/AppContext'

export function useCravings() {
  const { user } = useApp()
  const [cravings, setCravings] = useState<Craving[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCravings = async (options?: { limit?: number; filter?: string }) => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const result = await cravingService.getByUser(user.id, options)
      if (result.success && result.data) {
        setCravings(result.data)
      } else {
        setError(result.error || 'Failed to fetch cravings')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const logCraving = async (cravingData: Omit<Craving, 'id' | 'user' | 'created' | 'updated'>) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    setError(null)
    try {
      const result = await cravingService.create({
        ...cravingData,
        user: user.id,
      })
      if (result.success && result.data) {
        setCravings((prev) => [result.data!, ...prev])
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to log craving')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const getTrend = async (days: number = 30) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    try {
      return await cravingService.getTrend(user.id, days)
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const getTriggerBreakdown = async () => {
    if (!user?.id) return { success: false, error: 'User not found' }

    try {
      return await cravingService.getTriggerBreakdown(user.id)
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchCravings({ limit: 50 })
    }
  }, [user?.id])

  return {
    cravings,
    loading,
    error,
    fetchCravings,
    logCraving,
    getTrend,
    getTriggerBreakdown,
  }
}

