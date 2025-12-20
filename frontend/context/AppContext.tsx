import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authHelpers } from '../lib/pocketbase'
import { profileService } from '../services/profile.service'
import { progressService } from '../services/progress.service'
import { sessionService } from '../services/session.service'
import { achievementService } from '../services/achievement.service'
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

  // Update language and persist to localStorage
  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('app_language', lang)
  }

  // Sync language from user profile when profile is loaded
  useEffect(() => {
    if (userProfile?.language) {
      // If profile has a language, use it and sync to localStorage
      if (userProfile.language !== language) {
        setLanguageState(userProfile.language)
        localStorage.setItem('app_language', userProfile.language)
      }
    } else if (userProfile && !userProfile.language) {
      // If profile exists but has no language, save current language to profile
      if (user?.id && language) {
        profileService.updateProfile(user.id, {
          language: language as any,
        }).catch(console.error)
      }
    }
  }, [userProfile?.language, user?.id, language])

  // Sync with PocketBase auth state on mount
  useEffect(() => {
    const currentUser = authHelpers.getCurrentUser()
    if (currentUser && authHelpers.isAuthenticated()) {
      setIsAuthenticated(true)
      setUser({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name || currentUser.email,
      })
    }
  }, [])

  // Fetch user profile when user changes
  const fetchUserProfile = async () => {
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
  }

  // Update user profile - accepts full profile or partial updates
  const updateUserProfile = async (data: Partial<UserProfile> | UserProfile) => {
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
  }

  // Fetch current session
  const fetchCurrentSession = async () => {
    if (!user?.id) return
    setSessionLoading(true)
    try {
      const result = await sessionService.getCurrentSession(user.id)
      if (result.success && result.data) {
        setCurrentSession(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch current session:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  // Refresh progress stats
  const refreshProgress = async () => {
    if (!user?.id) return
    setProgressLoading(true)
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
      setProgressLoading(false)
    }
  }

  // Clear all user data on logout
  const clearUserData = () => {
    setUserProfile(null)
    setProgressStats(null)
    setCurrentSession(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  // Auto-fetch when user is set
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      fetchUserProfile()
      fetchCurrentSession()
      refreshProgress()
      // Check achievements on app open
      achievementService.checkAndUnlock(user.id).catch(console.error)
      
      // Request notification permission and schedule reminders
      if (userProfile?.enable_reminders && userProfile?.daily_reminder_time) {
        import('../utils/notifications').then(({ NotificationService }) => {
          NotificationService.requestPermission().then((granted) => {
            if (granted && userProfile.daily_reminder_time) {
              NotificationService.scheduleDailyReminder(userProfile.daily_reminder_time)
            }
          })
        })
      }
    }
  }, [user?.id, isAuthenticated, userProfile?.enable_reminders, userProfile?.daily_reminder_time])

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

