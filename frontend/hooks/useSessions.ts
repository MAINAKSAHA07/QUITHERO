import { useState, useEffect, useCallback } from 'react'
import { sessionService, programService } from '../services'
import { UserSession, ProgramDay, Step, SessionProgress } from '../types/models'
import { useApp } from '../context/AppContext'

export function useSessions() {
  const { user } = useApp()
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)
  const [programDays, setProgramDays] = useState<ProgramDay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentSession = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const result = await sessionService.getCurrentSession(user.id)
      if (result.success && result.data) {
        setCurrentSession(result.data)
        // Fetch program days
        if (result.data.program) {
          const programId = typeof result.data.program === 'string' ? result.data.program : result.data.program.id
          const daysResult = await programService.getProgramDays(programId)
          if (daysResult.success && daysResult.data) {
            setProgramDays(daysResult.data)
          }
        }
      } else {
        setError(result.error || 'Failed to fetch session')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const getSessionProgress = useCallback(async (programDayId: string) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    try {
      return await sessionService.getSessionProgress(user.id, programDayId)
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [user?.id])

  const updateSessionProgress = useCallback(async (
    programDayId: string,
    data: Partial<SessionProgress>
  ) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    try {
      const result = await sessionService.upsertSessionProgress(user.id, programDayId, data)
      return result
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const saveStepResponse = useCallback(async (stepId: string, response: any) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    try {
      return await sessionService.saveStepResponse(user.id, stepId, response)
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [user?.id])

  const completeSession = useCallback(async (programDayId: string, timeSpentMinutes: number) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    try {
      const result = await sessionService.completeSession(user.id, programDayId, timeSpentMinutes)
      if (result.success) {
        // Refresh current session
        await fetchCurrentSession()
      }
      return result
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user?.id, fetchCurrentSession])

  useEffect(() => {
    if (user?.id) {
      fetchCurrentSession()
    }
  }, [user?.id])

  return {
    currentSession,
    programDays,
    loading,
    error,
    fetchCurrentSession,
    getSessionProgress,
    updateSessionProgress,
    saveStepResponse,
    completeSession,
  }
}
