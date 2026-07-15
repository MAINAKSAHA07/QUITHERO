import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { pb, authHelpers, mapAuthRecordToAppUser } from '../lib/pocketbase'
import { preferenceToReminderTime } from '../utils/reminderTime'
import { fetchDailyQuoteText } from '../utils/dailyQuote'
import { NotificationService } from '../utils/notifications'
import { profileService } from '../services/profile.service'
import { progressService } from '../services/progress.service'
import { sessionService } from '../services/session.service'
import { programService } from '../services/program.service'
import { achievementService } from '../services/achievement.service'
import { behaviorProfileService } from '../services/behavior-profile.service'
import { behaviorTracker } from '../services/behavior-tracker.service'
import {
  aiNotificationScheduler,
} from '../services/ai-notification.service'
import { expectedCurrentDayNumber, indexProgressByDayId } from '../utils/programProgress'
import { syncQuitDateWithSessions } from '../services/quitDateSync.service'
import { UserProfile, ProgressStats, UserSession } from '../types/models'

interface AppContextType {
  language: string
  setLanguage: (lang: string) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
  user: any
  setUser: (user: any) => void
  // Enhanced state
  userProfile: UserProfile | null
  progressStats: ProgressStats | null
  currentSession: UserSession | null
  isPremium: boolean
  // Loading states
  profileLoading: boolean
  progressLoading: boolean
  sessionLoading: boolean
  // Methods
  fetchUserProfile: () => Promise<void>
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
  fetchCurrentSession: () => Promise<void>
  refreshProgress: () => Promise<void>
  clearUserData: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  // Load language from localStorage or default to 'en'
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem('app_language')
    return savedLanguage || 'en'
  })
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null)
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)
  // Avoid putting currentSession in fetchCurrentSession deps — that blocked resync after day completes
  const currentSessionRef = useRef<UserSession | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)

  // TODO: Re-enable when payment API is integrated
  // const isPremium = userProfile?.subscription_status === 'active'
  const isPremium = true

  // Update language and persist to localStorage
  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('app_language', lang)
  }

  // Sync language from user profile when profile is loaded (one-way: profile → app)
  useEffect(() => {
    if (userProfile?.language && userProfile.language !== language) {
      setLanguageState(userProfile.language)
      localStorage.setItem('app_language', userProfile.language)
    }
  }, [userProfile?.language, language])

  // Backfill missing profile language once — not on every render
  const languageBackfillDone = useRef(false)
  useEffect(() => {
    if (languageBackfillDone.current || !user?.id || !userProfile || userProfile.language) return
    languageBackfillDone.current = true
    profileService.updateProfile(user.id, { language: language as any }).catch(console.error)
  }, [user?.id, userProfile, language])

  // Sync with PocketBase auth state on mount
  useEffect(() => {
    const currentUser = authHelpers.getCurrentUser()
    if (currentUser && authHelpers.isAuthenticated()) {
      setIsAuthenticated(true)
      const mapped = mapAuthRecordToAppUser(currentUser as Record<string, unknown>)
      if (mapped) setUser(mapped)
    }
  }, [])

  // lastActive heartbeat is written on real app actions only (not passive tab open)

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return
    setProfileLoading(true)
    try {
      const result = await profileService.getByUserId(user.id)
      if (result.success && result.data) {
        setUserProfile(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  // Update user profile - accepts full profile or partial updates
  const updateUserProfile = useCallback(async (data: Partial<UserProfile> | UserProfile) => {
    if (!user?.id) return
    setProfileLoading(true)
    try {
      // If data has an id, it's a full profile object from upsert
      // Otherwise, use updateProfile for partial updates
      let result
      if ('id' in data && data.id) {
        // Full profile object - just update state
        setUserProfile(data as UserProfile)
        setProfileLoading(false)
        return
      } else {
        // Partial update - call service
        result = await profileService.updateProfile(user.id, data)
        if (result.success && result.data) {
          setUserProfile(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to update user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  const fetchCurrentSession = useCallback(async () => {
    if (!user?.id) return
    const silent = currentSessionRef.current !== null
    if (!silent) setSessionLoading(true)
    try {
      const result = await sessionService.getOrCreateCurrentSession(user.id)
      if (result.success && result.data) {
        let session = result.data
        const programId = typeof session.program === 'string'
          ? session.program
          : (session.program as { id?: string })?.id
        if (programId) {
          const daysResult = await programService.getProgramDays(programId)
          if (daysResult.success && daysResult.data?.length) {
            const allProgress = await pb.collection('session_progress').getFullList({
              filter: `user = "${user.id}"`,
              fields: 'id,program_day,status',
            }).catch(() => [])
            const progressByDay = indexProgressByDayId(allProgress as any[])
            const expectedDay = expectedCurrentDayNumber(daysResult.data, progressByDay)
            if ((session.current_day || 1) !== expectedDay && session.id) {
              pb.collection('user_sessions').update(session.id, {
                current_day: expectedDay,
                status: expectedDay > 30 ? 'completed' : 'in_progress',
              }).catch(() => {})
              session = { ...session, current_day: expectedDay }
            }
          }
        }
        setCurrentSession(session)
        currentSessionRef.current = session
        // Align quit_date with session pace when user fell behind
        syncQuitDateWithSessions(user.id).then((nextQuit) => {
          if (nextQuit) fetchUserProfile()
        }).catch(() => {})
      } else {
        console.error('[AppContext] Failed to load program session:', result.error)
        setCurrentSession(null)
        currentSessionRef.current = null
      }
    } catch (error) {
      console.error('Failed to fetch current session:', error)
      setCurrentSession(null)
      currentSessionRef.current = null
    } finally {
      if (!silent) setSessionLoading(false)
    }
  }, [user?.id, fetchUserProfile])

  const refreshProgress = useCallback(async () => {
    if (!user?.id) return
    const silent = progressStats !== null
    if (!silent) setProgressLoading(true)
    try {
      const result = await progressService.calculateProgress(user.id)
      if (result.success) {
        const statsResult = await progressService.getByUserId(user.id)
        if (statsResult.success && statsResult.data) {
          setProgressStats(statsResult.data)
        }
        // quit_date may have been pushed during calculateProgress
        await fetchUserProfile()
      }
    } catch (error) {
      console.error('Failed to refresh progress:', error)
    } finally {
      if (!silent) setProgressLoading(false)
    }
  // ponytail: omit progressStats from deps — including it recreates this fn every upsert and re-fires the login load effect
  }, [user?.id, fetchUserProfile])

  const clearUserData = useCallback(() => {
    behaviorTracker.destroy()
    aiNotificationScheduler.destroy()
    setUserProfile(null)
    setProgressStats(null)
    setCurrentSession(null)
    currentSessionRef.current = null
    setUser(null)
    setIsAuthenticated(false)
    languageBackfillDone.current = false
  }, [])

  const initialLoadDone = useRef<string | null>(null)

  // Load user data once per login — avoid refetch loops that flicker the UI
  useEffect(() => {
    if (!user?.id || !isAuthenticated) {
      initialLoadDone.current = null
      return
    }
    if (initialLoadDone.current === user.id) return
    initialLoadDone.current = user.id

    fetchUserProfile()
    fetchCurrentSession()
    refreshProgress()
    achievementService.checkAndUnlock(user.id).catch(console.error)
    behaviorProfileService.refreshIfStale(user.id, 24).catch(() => {})
    behaviorTracker.init(user.id)
  }, [user?.id, isAuthenticated, fetchUserProfile, fetchCurrentSession, refreshProgress])

  // Listen for notification opens (learning feedback → best_notification_hour / open rate)
  useEffect(() => {
    if (!user?.id) return

    const handleOpened = (eventId?: string, triggerType?: string) => {
      if (!eventId) return
      aiNotificationScheduler.markOpened(eventId, triggerType).catch(() => {})
    }

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'smono_notification_opened') {
        handleOpened(event.data.eventId, event.data.triggerType)
      }
    }
    const onWindowEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      handleOpened(detail.eventId, detail.triggerType)
    }

    navigator.serviceWorker?.addEventListener('message', onSwMessage)
    window.addEventListener('smono_notification_opened', onWindowEvent)
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onSwMessage)
      window.removeEventListener('smono_notification_opened', onWindowEvent)
    }
  }, [user?.id])

  // Server Web Push (works when app closed) + local / AI-timed reminders when app is open
  useEffect(() => {
    if (!user?.id) return

    const remindersOn = userProfile?.enable_reminders !== false
    const reminderTime =
      userProfile?.daily_reminder_time ||
      preferenceToReminderTime(userProfile?.checkin_time_preference)
    const dayNumber = currentSession?.current_day || 1

    let cancelled = false
    ;(async () => {
      const { ensureServerPushRegistered, enablePushNotifications } = await import(
        '../utils/pushNotifications'
      )

      if (remindersOn) {
        if (Notification.permission === 'granted') {
          await ensureServerPushRegistered(user.id).catch(() => {})
        } else if (Notification.permission === 'default' && userProfile?.enable_reminders) {
          await enablePushNotifications().catch(() => {})
        }
      }

      if (cancelled) return

      // Always keep intervention scheduler attached (craving/slip); scheduled daily when learning
      const learning = await behaviorProfileService.isPersonalizationActive(user.id).catch(() => false)
      if (cancelled) return

      await aiNotificationScheduler
        .init(user.id, dayNumber, {
          enableScheduled: Boolean(remindersOn && learning),
        })
        .catch(() => {})

      if (cancelled || !userProfile?.enable_reminders) return

      // Flat morning quote while still in observing phase (learning owns timing once active)
      if (!learning) {
        const quote = await fetchDailyQuoteText(userProfile.language || 'en')
        if (cancelled || !NotificationService.isSupported()) return
        NotificationService.checkDueReminder()
        NotificationService.scheduleDailyReminder(reminderTime, quote)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    user?.id,
    userProfile?.enable_reminders,
    userProfile?.daily_reminder_time,
    userProfile?.checkin_time_preference,
    userProfile?.language,
    userProfile?.timezone,
    currentSession?.current_day,
  ])

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        userProfile,
        progressStats,
        currentSession,
        isPremium,
        profileLoading,
        progressLoading,
        sessionLoading,
        fetchUserProfile,
        updateUserProfile,
        fetchCurrentSession,
        refreshProgress,
        clearUserData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

