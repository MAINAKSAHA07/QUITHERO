import { BaseService } from './base.service'
import { JournalEntry } from '../types/models'
import { ApiResponse } from '../types/api'
import { pb } from '../lib/pocketbase'

export class JournalService extends BaseService {
  constructor() {
    super('journal_entries')
  }

  /**
   * Get user's journal entries
   */
  async getByUser(
    userId: string,
    options?: {
      filter?: string
      sort?: string
      limit?: number
    }
  ): Promise<ApiResponse<JournalEntry[]>> {
    try {
      const filter = options?.filter
        ? `user = "${userId}" && ${options.filter}`
        : `user = "${userId}"`
      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort: options?.sort || '-date',
        ...(options?.limit && { limit: options.limit }),
      })
      return { success: true, data: records }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get entries by date range
   */
  async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<JournalEntry[]>> {
    try {
      const records = await pb.collection(this.collectionName).getFullList({
        filter: `user = "${userId}" && date >= "${startDate}" && date <= "${endDate}"`,
        sort: '-date',
      })
      return { success: true, data: records }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get entry by date
   */
  async getByDate(userId: string, date: string): Promise<ApiResponse<JournalEntry | null>> {
    try {
      const result = await pb
        .collection(this.collectionName)
        .getFirstListItem(`user = "${userId}" && date = "${date}"`)
        .catch(() => null)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Create journal entry
   */
  async createEntry(userId: string, data: Omit<JournalEntry, 'id' | 'user' | 'created' | 'updated'>): Promise<ApiResponse<JournalEntry>> {
    return await this.create({
      ...data,
      user: userId,
      date: data.date || new Date().toISOString().split('T')[0],
    })
  }

  /**
   * Update journal entry
   */
  async updateEntry(entryId: string, data: Partial<JournalEntry>): Promise<ApiResponse<JournalEntry>> {
    return await this.update(entryId, data)
  }

  /**
   * Delete journal entry
   */
  async deleteEntry(entryId: string): Promise<ApiResponse<void>> {
    return await this.delete(entryId)
  }
}

export const journalService = new JournalService()

