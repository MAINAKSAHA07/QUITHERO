import { useState, useEffect, useCallback, useRef } from 'react'
import { sessionService, programService } from '../services'
import { UserSession, ProgramDay, SessionProgress } from '../types/models'
import { useApp } from '../context/AppContext'
import pb from '../lib/pocketbase'
import { expectedCurrentDayNumber, indexProgressByDayId } from '../utils/programProgress'

// ponytail: module-level in-flight guard — prevents concurrent duplicate fetches
let _fetchInFlight = false

export function useSessions() {
  const { user, language, userProfile } = useApp()
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)
  const [programDays, setProgramDays] = useState<ProgramDay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userIdRef = useRef<string | undefined>(undefined)

  const fetchCurrentSession = useCallback(async () => {
    if (!user?.id || _fetchInFlight) return
    _fetchInFlight = true
    setLoading(true)
    setError(null)
    try {
      const result = await sessionService.getOrCreateCurrentSession(
        user.id,
        language || userProfile?.language || 'en'
      )
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to load program session')
        setCurrentSession(null)
        return
      }
      let session = result.data

      // Fetch program days if we have a program
      if (session.program) {
        const programId = typeof session.program === 'string'
          ? session.program
          : (session.program as any)?.id || session.program

        const daysResult = await programService.getProgramDays(programId)
        if (daysResult.success && daysResult.data) {
          setProgramDays(daysResult.data)

          // Self-heal: ONE batch call, not N individual calls
          const allProgress = await pb.collection('session_progress').getFullList({
            filter: `user = "${user.id}"`,
            fields: 'id,program_day,status',
          }).catch(() => [] as any[])

          const progressByDay = indexProgressByDayId(allProgress as any[])
          const expectedCurrentDay = expectedCurrentDayNumber(daysResult.data, progressByDay)

          if ((session.current_day || 1) !== expectedCurrentDay) {
            // ponytail: fire-and-forget — UI doesn't need to wait for this write
            pb.collection('user_sessions').update(session.id!, {
              current_day: expectedCurrentDay,
              status: expectedCurrentDay > 30 ? 'completed' : 'in_progress',
            }).catch((err) => console.error('[Self-Heal] DB update failed:', err))

            session = { ...session, current_day: expectedCurrentDay }
          }
        }
      }

      setCurrentSession(session)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      _fetchInFlight = false
    }
  }, [user?.id, language, userProfile?.language])
  useEffect(() => {
    if (userIdRef.current && userIdRef.current !== user?.id) {
      setCurrentSession(null)
      setProgramDays([])
      setError(null)
    }
    userIdRef.current = user?.id
  }, [user?.id])

  useEffect(() => {
    if (user?.id) fetchCurrentSession()
  }, [user?.id, fetchCurrentSession])

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
      return await sessionService.upsertSessionProgress(user.id, programDayId, data)
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
        await fetchCurrentSession()
      }
      return result
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user?.id, fetchCurrentSession])

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
