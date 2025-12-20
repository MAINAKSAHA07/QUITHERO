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
    // Check if user is already authenticated
    const currentUser = adminAuthHelpers.getCurrentUser()
    if (currentUser) {
      setUser(currentUser as any as AdminUser)
    }
    setIsLoading(false)

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model as AdminUser | null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const result = await adminAuthHelpers.login(email, password)
    if (result.success) {
      setUser(result.data?.record as any as AdminUser)
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
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}





