import { BaseService } from './base.service'
import { SupportTicket, SupportTicketMessage } from '../types/models'
import { SupportTicketStatus, SupportTicketPriority, SupportTicketCategory } from '../types/enums'
import { ApiResponse } from '../types/api'
import { recentSort, pb } from '../lib/pocketbase'

async function supportApi<T>(
  path: string,
  options?: { method?: string; body?: Record<string, unknown> }
): Promise<ApiResponse<T>> {
  try {
    const token = pb.authStore.token
    if (!token) return { success: false, error: 'Login required' }

    const res = await fetch(path, {
      method: options?.method || 'GET',
      headers: {
        Authorization: token,
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || data.message || `Request failed (${res.status})` }
    }
    return { success: true, data: (data.data ?? data) as T }
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' }
  }
}

export class SupportService extends BaseService {
  constructor() {
    super('support_tickets')
  }

  /** Create ticket + first message (encrypted server-side). */
  async createTicket(
    userId: string,
    data: {
      subject: string
      message?: string
      description?: string
      category?: SupportTicketCategory
      priority?: SupportTicketPriority
    }
  ): Promise<ApiResponse<SupportTicket>> {
    const result = await supportApi<SupportTicket>('/api/support/tickets', {
      method: 'POST',
      body: {
        subject: data.subject,
        message: data.message || data.description || '',
        category: data.category || SupportTicketCategory.OTHER,
        priority: data.priority || SupportTicketPriority.MEDIUM,
      },
    })
    // userId unused — API binds ticket to auth user (prevents spoofing)
    void userId
    return result
  }

  async getByUser(
    userId: string,
    options?: {
      filter?: string
      sort?: string
      limit?: number
    }
  ): Promise<ApiResponse<SupportTicket[]>> {
    try {
      let filter = `user = "${userId}"`
      if (options?.filter) {
        filter = `${filter} && ${options.filter}`
      }

      const result = await this.getAll({
        filter,
        sort: options?.sort || recentSort(this.collectionName),
      })

      if (result.success && result.data) {
        let tickets = result.data as SupportTicket[]
        if (options?.limit) {
          tickets = tickets.slice(0, options.limit)
        }
        return { success: true, data: tickets }
      }

      return result as ApiResponse<SupportTicket[]>
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  async getTicket(ticketId: string): Promise<ApiResponse<SupportTicket>> {
    return this.getOne(ticketId)
  }

  async updateTicket(
    ticketId: string,
    updates: {
      status?: SupportTicketStatus
      message?: string
    }
  ): Promise<ApiResponse<SupportTicket>> {
    return this.update(ticketId, updates)
  }

  async getMessages(ticketId: string): Promise<ApiResponse<SupportTicketMessage[]>> {
    return supportApi<SupportTicketMessage[]>(
      `/api/support/messages?ticket=${encodeURIComponent(ticketId)}`
    )
  }

  async sendMessage(
    ticketId: string,
    body: string,
    _senderRole: 'user' | 'admin' = 'user'
  ): Promise<ApiResponse<SupportTicketMessage>> {
    void _senderRole
    return supportApi<SupportTicketMessage>('/api/support/messages', {
      method: 'POST',
      body: { ticket: ticketId, body: body.trim() },
    })
  }
}

export const supportService = new SupportService()
