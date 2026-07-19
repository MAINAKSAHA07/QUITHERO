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

function authUserId(): string | null {
  const id = pb.authStore.record?.id || (pb.authStore.model as { id?: string } | null)?.id
  return id ? String(id) : null
}

function formatPbError(error: any, fallback: string): string {
  const fields = error?.data?.data
  if (fields && typeof fields === 'object') {
    const first = Object.values(fields).find(
      (f: any) => f && typeof f === 'object' && typeof f.message === 'string'
    ) as { message?: string } | undefined
    if (first?.message) return first.message
  }
  if (typeof error?.data?.message === 'string' && error.data.message) return error.data.message
  if (typeof error?.message === 'string' && error.message) return error.message
  return fallback
}

export async function getPendingDeletionRequest(
  _userId?: string
): Promise<ApiResponse<AccountDeletionRequest | null>> {
  const userId = authUserId()
  if (!userId) return { success: false, error: 'Not signed in' }

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
    return { success: false, error: formatPbError(error, 'Failed to load deletion request') }
  }
}

export async function submitDeletionRequest(
  _userId?: string,
  reason?: string
): Promise<ApiResponse<AccountDeletionRequest>> {
  // ponytail: createRule is @request.auth.id = user — must match auth store, not a stale context id
  const userId = authUserId()
  if (!userId) return { success: false, error: 'Not signed in' }

  try {
    const pending = await getPendingDeletionRequest()
    if (pending.data) {
      return { success: true, data: pending.data }
    }

    const payload: Record<string, string> = {
      user: userId,
      status: 'pending',
    }
    const trimmed = reason?.trim()
    if (trimmed) payload.reason = trimmed

    const record = await pb.collection('account_deletion_requests').create(payload)
    return { success: true, data: record as unknown as AccountDeletionRequest }
  } catch (error: any) {
    return { success: false, error: formatPbError(error, 'Failed to submit deletion request') }
  }
}
