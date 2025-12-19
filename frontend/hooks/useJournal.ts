import { useState, useEffect } from 'react'
import { journalService } from '../services/journal.service'
import { JournalEntry } from '../types/models'
import { useApp } from '../context/AppContext'

export function useJournal() {
  const { user } = useApp()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = async (options?: { filter?: string; sort?: string; limit?: number }) => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      const result = await journalService.getByUser(user.id, options)
      if (result.success && result.data) {
        setEntries(result.data)
      } else {
        setError(result.error || 'Failed to fetch entries')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createEntry = async (entryData: Omit<JournalEntry, 'id' | 'user' | 'created' | 'updated'>) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    setLoading(true)
    setError(null)
    try {
      const result = await journalService.createEntry(user.id, entryData)
      if (result.success && result.data) {
        setEntries((prev) => [result.data!, ...prev])
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to create entry')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const updateEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await journalService.updateEntry(entryId, updates)
      if (result.success && result.data) {
        setEntries((prev) => prev.map((e) => (e.id === entryId ? result.data! : e)))
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Failed to update entry')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await journalService.deleteEntry(entryId)
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId))
        return { success: true }
      } else {
        setError(result.error || 'Failed to delete entry')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const getByDateRange = async (startDate: string, endDate: string) => {
    if (!user?.id) return { success: false, error: 'User not found' }

    try {
      return await journalService.getByDateRange(user.id, startDate, endDate)
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchEntries()
    }
  }, [user?.id])

  return {
    entries,
    loading,
    error,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    getByDateRange,
  }
}

