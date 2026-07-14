import { pb } from '../lib/pocketbase'
import { ApiResponse } from '../types/api'

export type AccountDeletionStatus = 'pending' | 'rejected' | 'completed'

export interface AccountDeletionRequest {
  id: string
  user: string
  status: AccountDeletionStatus
  reason?: string
  admin_notes?: string
  processed_at?: string
  created: string
}

export async function getPendingDeletionRequest(
  userId: string
): Promise<ApiResponse<AccountDeletionRequest | null>> {
  try {
    const list = await pb.collection('account_deletion_requests').getList(1, 1, {
      filter: `user = "${userId}" && status = "pending"`,
      sort: '-created',
    })
    return {
      success: true,
      data: list.items[0]
        ? (list.items[0] as unknown as AccountDeletionRequest)
        : null,
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load deletion request' }
  }
}

export async function submitDeletionRequest(
  userId: string,
  reason?: string
): Promise<ApiResponse<AccountDeletionRequest>> {
  try {
    const pending = await getPendingDeletionRequest(userId)
    if (pending.data) {
      return { success: true, data: pending.data }
    }

    const record = await pb.collection('account_deletion_requests').create({
      user: userId,
      status: 'pending',
      reason: reason?.trim() || '',
    })
    return { success: true, data: record as unknown as AccountDeletionRequest }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to submit deletion request' }
  }
}
