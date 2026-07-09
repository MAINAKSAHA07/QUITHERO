import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { adminAuthHelpers, pb } from '../lib/pocketbase'

interface AdminUser {
  id: string
  email: string
  name?: string
  role?: string
  [key: string]: any
}

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

interface AdminAuthProviderProps {
  children: ReactNode
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!pb.authStore.isValid) {
        pb.authStore.clear()
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        await pb.collection('admin_users').authRefresh()
      } catch {
        pb.authStore.clear()
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      if (!cancelled) {
        setUser(pb.authStore.record as unknown as AdminUser)
        setIsLoading(false)
      }
    }

    bootstrap()

    const unsubscribe = pb.authStore.onChange((_token, model) => {
      if (pb.authStore.isValid && model) {
        setUser(model as unknown as AdminUser)
      } else {
        setUser(null)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const result = await adminAuthHelpers.login(email, password)
    if (result.success && pb.authStore.isValid) {
      setUser(result.data?.record as unknown as AdminUser)
    } else {
      setUser(null)
    }
    setIsLoading(false)
    return result
  }

  const logout = () => {
    adminAuthHelpers.logout()
    setUser(null)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: pb.authStore.isValid && !!user,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
