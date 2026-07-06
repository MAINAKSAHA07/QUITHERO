import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { authHelpers } from '../lib/pocketbase'
import { profileService } from '../services/profile.service'
import { progressService } from '../services/progress.service'
import { sessionService } from '../services/session.service'
import { achievementService } from '../services/achievement.service'
import { behaviorProfileService } from '../services/behavior-profile.service'
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
      setUser({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name || currentUser.email,
        avatar: currentUser.avatar || '',
      })
    }
  }, [])

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
    const silent = currentSession !== null
    if (!silent) setSessionLoading(true)
    try {
      const result = await sessionService.getOrCreateCurrentSession(user.id)
      if (result.success && result.data) {
        setCurrentSession(result.data)
      } else {
        console.error('[AppContext] Failed to load program session:', result.error)
        setCurrentSession(null)
      }
    } catch (error) {
      console.error('Failed to fetch current session:', error)
      setCurrentSession(null)
    } finally {
      if (!silent) setSessionLoading(false)
    }
  }, [user?.id, currentSession])

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
      }
    } catch (error) {
      console.error('Failed to refresh progress:', error)
    } finally {
      if (!silent) setProgressLoading(false)
    }
  }, [user?.id, progressStats])

  const clearUserData = useCallback(() => {
    setUserProfile(null)
    setProgressStats(null)
    setCurrentSession(null)
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
  }, [user?.id, isAuthenticated, fetchUserProfile, fetchCurrentSession, refreshProgress])

  // Reminder setup — separate from data load so profile fetch does not retrigger everything
  useEffect(() => {
    if (!user?.id || !userProfile?.enable_reminders || !userProfile.daily_reminder_time) return
    import('../utils/notifications').then(({ NotificationService }) => {
      NotificationService.requestPermission().then((granted) => {
        if (granted && userProfile.daily_reminder_time) {
          NotificationService.scheduleDailyReminder(userProfile.daily_reminder_time)
        }
      })
    })
  }, [user?.id, userProfile?.enable_reminders, userProfile?.daily_reminder_time])

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

