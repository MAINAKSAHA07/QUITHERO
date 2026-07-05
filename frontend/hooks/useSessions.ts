import { useState, useEffect, useCallback } from 'react'
import { sessionService, programService } from '../services'
import { UserSession, ProgramDay, SessionProgress } from '../types/models'
import { useApp } from '../context/AppContext'
import pb from '../lib/pocketbase'

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
        let session = result.data
        
        // Fetch program days & completed progress to check for lags
        if (session.program) {
          const programId = typeof session.program === 'string' 
            ? session.program 
            : (session.program as any)?.id || session.program
            
          const [daysResult, progressResult] = await Promise.all([
            programService.getProgramDays(programId),
            pb.collection('session_progress').getFullList({
              filter: `user = "${user.id}"`,
            }).catch(() => [])
          ])

          if (daysResult.success && daysResult.data) {
            setProgramDays(daysResult.data)
            
            // Expected current day is completedCount + 1
            const completedCount = progressResult.filter((p: any) => p.status === 'completed').length
            const expectedCurrentDay = completedCount + 1
            
            // Self-heal: if DB current_day is lagging behind the actual progress records, sync it!
            if ((session.current_day || 1) < expectedCurrentDay) {
              console.log(`[Self-Heal] Syncing session day: was ${session.current_day}, expected ${expectedCurrentDay}`)
              
              // Correct database record in the background
              pb.collection('user_sessions').update(session.id!, {
                current_day: expectedCurrentDay,
                status: expectedCurrentDay > 30 ? 'completed' : 'in_progress',
              }).catch((err) => console.error('Self-heal DB update failed:', err))

              // Correct in-memory state
              session = {
                ...session,
                current_day: expectedCurrentDay,
              }
            }
          }
        }
        
        setCurrentSession(session)
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
