import { useState, useEffect } from 'react'
import { sessionService, programService } from '../services'
import { UserSession, ProgramDay, Step, SessionProgress } from '../types/models'
import { useApp } from '../context/AppContext'

export function useSessions() {
  const { user } = useApp()
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)
  const [programDays, setProgramDays] = useState<ProgramDay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentSession = async () => {
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
  }

  const getSessionProgress = async (programDayId: string) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    try {
      return await sessionService.getSessionProgress(user.id, programDayId)
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const updateSessionProgress = async (
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
  }

  const saveStepResponse = async (stepId: string, response: any) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    try {
      return await sessionService.saveStepResponse(user.id, stepId, response)
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const completeSession = async (programDayId: string, timeSpentMinutes: number) => {
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
  }

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

