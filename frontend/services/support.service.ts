import { BaseService } from './base.service'
import { SupportTicket } from '../types/models'
import { SupportTicketStatus, SupportTicketPriority, SupportTicketCategory } from '../types/enums'
import { ApiResponse } from '../types/api'

export class SupportService extends BaseService {
  constructor() {
    super('support_tickets')
  }

  /**
   * Create a new support ticket
   */
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
    try {
      const ticketData = {
        user: userId,
        subject: data.subject,
        message: data.message || data.description || '',
        description: data.description || data.message || '',
        status: SupportTicketStatus.OPEN,
        priority: data.priority || SupportTicketPriority.MEDIUM,
        category: data.category || SupportTicketCategory.OTHER,
      }

      const result = await this.create(ticketData)
      return result
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get user's support tickets
   */
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
        sort: options?.sort || '-created',
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

  /**
   * Get a single ticket by ID
   */
  async getTicket(ticketId: string): Promise<ApiResponse<SupportTicket>> {
    return this.getOne(ticketId)
  }

  /**
   * Update ticket status (for user to close their own ticket)
   */
  async updateTicket(
    ticketId: string,
    updates: {
      status?: SupportTicketStatus
      message?: string
    }
  ): Promise<ApiResponse<SupportTicket>> {
    return this.update(ticketId, updates)
  }
}

export const supportService = new SupportService()
