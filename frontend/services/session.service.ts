import { BaseService } from './base.service'
import { UserSession, SessionProgress, StepResponse } from '../types/models'
import { ApiResponse } from '../types/api'
import { SessionStatus } from '../types/enums'
import { pb } from '../lib/pocketbase'
import { programService } from './program.service'

export class SessionService extends BaseService {
  constructor() {
    super('user_sessions')
  }

  /**
   * Get user's current session
   */
  async getCurrentSession(userId: string): Promise<ApiResponse<UserSession>> {
    try {
      if (!pb.authStore.isValid || !pb.authStore.model) {
        return { success: true, data: null as any }
      }

      const authUserId = pb.authStore.model.id
      const targetUserId = userId || authUserId

      try {
        const result = await pb.collection('user_sessions').getFirstListItem(
          `user = "${targetUserId}"`,
          { expand: 'program' }
        )
        return { success: true, data: result as any }
      } catch (error: any) {
        if (error.status === 404 || error.status === 400) {
          return { success: true, data: null as any }
        }
        throw error
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch session' }
    }
  }

  /**
   * Get user's current session, creating one for the active program if missing.
   * ponytail: single guard — KYC used to create sessions in ReminderSettings; new flow skipped that.
   */
  async getOrCreateCurrentSession(userId: string, language: string = 'en'): Promise<ApiResponse<UserSession>> {
    const existing = await this.getCurrentSession(userId)
    if (!existing.success) return existing
    if (existing.data) return existing

    let programResult = await programService.getActiveProgram(language)
    if ((!programResult.success || !programResult.data?.id) && language !== 'en') {
      programResult = await programService.getActiveProgram('en')
    }
    if (!programResult.success || !programResult.data?.id) {
      return { success: false, error: programResult.error || 'No active program found' }
    }

    return this.createOrGetSession(userId, programResult.data.id)
  }

  /**
   * Create or get user session
   */
  async createOrGetSession(userId: string, programId: string): Promise<ApiResponse<UserSession>> {
    try {
      // Try to get existing session using getList for better error handling
      const existingResult = await pb.collection('user_sessions').getList(1, 1, {
        filter: `user = "${userId}" && program = "${programId}"`,
        expand: 'program',
      }).catch(() => ({ items: [] }))

      if (existingResult.items && existingResult.items.length > 0) {
        return { success: true, data: existingResult.items[0] as any }
      }

      // Create new session
      const newSession = await pb.collection('user_sessions').create({
        user: userId,
        program: programId,
        current_day: 1,
        status: 'not_started',
      })

      return { success: true, data: newSession as any }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create session' }
    }
  }

  /**
   * Get session progress for a program day
   */
  async getSessionProgress(userId: string, programDayId: string): Promise<ApiResponse<SessionProgress>> {
    try {
      const result = await pb.collection('session_progress').getFirstListItem(
        `user = "${userId}" && program_day = "${programDayId}"`,
        { expand: 'program_day' }
      )
      return { success: true, data: result as any }
    } catch (error: any) {
      // If not found, return success with null data (will create on start)
      if (error.status === 404) {
        return { success: true, data: null as any }
      }
      return { success: false, error: error.message }
    }
  }

  /**
   * Create or update session progress
   */
  async upsertSessionProgress(
    userId: string,
    programDayId: string,
    data: Partial<SessionProgress>
  ): Promise<ApiResponse<SessionProgress>> {
    try {
      const existing = await this.getSessionProgress(userId, programDayId)

      if (existing.success && existing.data && existing.data.id) {
        // Update existing
        const updated = await pb.collection('session_progress').update(existing.data.id, {
          ...data,
          user: userId,
          program_day: programDayId,
        })
        return { success: true, data: updated as any }
      } else {
        // Create new
        const created = await pb.collection('session_progress').create({
          ...data,
          user: userId,
          program_day: programDayId,
          status: data.status || 'not_started',
          last_step_index: data.last_step_index || 0,
        })
        return { success: true, data: created as any }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Save step response
   */
  async saveStepResponse(
    userId: string,
    stepId: string,
    response: any
  ): Promise<ApiResponse<StepResponse>> {
    try {
      // Check if response already exists
      const existing = await pb
        .collection('step_responses')
        .getFirstListItem(`user = "${userId}" && step = "${stepId}"`)
        .catch(() => null)

      if (existing) {
        // Update existing
        const updated = await pb.collection('step_responses').update(existing.id, {
          response_json: response,
        })
        return { success: true, data: updated as any }
      } else {
        // Create new
        const created = await pb.collection('step_responses').create({
          user: userId,
          step: stepId,
          response_json: response,
        })
        return { success: true, data: created as any }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Complete a session
   */
  async completeSession(
    userId: string,
    programDayId: string,
    timeSpentMinutes: number
  ): Promise<ApiResponse<SessionProgress>> {
    try {
      // Update session progress
      const progress = await this.upsertSessionProgress(userId, programDayId, {
        status: SessionStatus.COMPLETED,
        completed_at: new Date().toISOString(),
        time_spent_minutes: timeSpentMinutes,
      })

      // Update user session to next day
      const userSession = await this.getCurrentSession(userId)
      if (userSession.success && userSession.data) {
        const programDay = await pb
          .collection('program_days')
          .getOne(programDayId)
          .catch(() => null)

        if (programDay) {
          const nextDay = programDay.day_number + 1
          await pb.collection('user_sessions').update(userSession.data.id!, {
            current_day: nextDay,
            status: nextDay > 30 ? 'completed' : 'in_progress',
          })
        }
      }

      return progress
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const sessionService = new SessionService()

