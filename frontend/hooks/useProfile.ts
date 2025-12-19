import { useState, useEffect } from 'react'
import { profileService } from '../services/profile.service'
import { UserProfile } from '../types/models'
import { useApp } from '../context/AppContext'

export function useProfile() {
  const { user } = useApp()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const result = await profileService.getByUserId(user.id)
      if (result.success && result.data) {
        setProfile(result.data)
      } else {
        setError(result.error || 'Failed to fetch profile')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    setError(null)
    try {
      const result = await profileService.updateProfile(user.id, updates)
      if (result.success && result.data) {
        setProfile(result.data)
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to update profile')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const upsertProfile = async (data: Partial<UserProfile>) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    setError(null)
    try {
      const result = await profileService.upsert(user.id, data)
      if (result.success && result.data) {
        setProfile(result.data)
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to save profile')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    }
  }, [user?.id])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    upsertProfile,
  }
}

