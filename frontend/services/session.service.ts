import { BaseService } from './base.service'
import { UserSession, SessionProgress, StepResponse } from '../types/models'
import { ApiResponse } from '../types/api'
import { SessionStatus } from '../types/enums'
import { pb } from '../lib/pocketbase'

export class SessionService extends BaseService {
  constructor() {
    super('user_sessions')
  }

  /**
   * Get user's current session
   */
  async getCurrentSession(userId: string): Promise<ApiResponse<UserSession>> {
    try {
      // Verify user is authenticated
      if (!pb.authStore.isValid || !pb.authStore.model) {
        console.warn('User not authenticated, returning null session')
        return { success: true, data: null as any }
      }

      // Check if authenticated user matches the requested userId
      const authUserId = pb.authStore.model.id
      if (authUserId !== userId) {
        console.warn(`User ID mismatch: auth=${authUserId}, requested=${userId}`)
        // Still try the query, but log the mismatch
      }

      // With API rule @request.auth.id = user, PocketBase auto-filters by authenticated user
      // For new users, there may be no sessions yet, which can cause 400 errors
      // We'll handle this gracefully by returning null
      let result
      
      try {
        // Simplest query - just get list, let API rules handle filtering
        // No sort parameter to avoid potential issues
        result = await pb.collection('user_sessions').getList(1, 1)
      } catch (error: any) {
        // 400 errors often mean "no records found" when using API rules
        // This is expected for new users who haven't completed onboarding
        if (error.status === 400 || error.status === 404) {
          // Silently return null - this is normal for users without sessions
          return { success: true, data: null as any }
        }
        
        // For other errors, log but still return null to prevent app breakage
        // Only log in development mode
        if (import.meta.env.DEV) {
          console.warn('Session query failed (non-critical):', error.message)
        }
        return { success: true, data: null as any }
      }
      
      if (result.items && result.items.length > 0) {
        const session = result.items[0]
        
        // Verify the session belongs to the user (safety check)
        const sessionUserId = typeof session.user === 'string' ? session.user : session.user?.id
        if (sessionUserId !== userId && sessionUserId !== authUserId) {
          console.warn('Session user mismatch, returning null')
          return { success: true, data: null as any }
        }
        
        // If we have a program relation, try to expand it separately
        if (session.program) {
          try {
            const expandedSession = await pb.collection('user_sessions').getOne(session.id, {
              expand: 'program',
            })
            return { success: true, data: expandedSession as any }
          } catch (expandError: any) {
            // If expand fails, return without expand
            console.warn('Failed to expand program relation:', expandError)
            return { success: true, data: session as any }
          }
        }
        
        return { success: true, data: session as any }
      }
      
      // No session found, return null
      return { success: true, data: null as any }
    } catch (error: any) {
      // Log full error details for debugging
      console.error('Error fetching current session:', error)
      console.error('Error details:', {
        status: error.status,
        message: error.message,
        data: error.data,
        response: error.response,
        url: error.url,
        isAbort: error.isAbort,
        originalError: error.originalError,
      })
      
      // Check if user is authenticated
      console.error('Auth state:', {
        isValid: pb.authStore.isValid,
        model: pb.authStore.model ? { id: pb.authStore.model.id, email: pb.authStore.model.email } : null,
        token: pb.authStore.token ? 'present' : 'missing',
      })
      
      // If no session found (404), return success with null (will be created during onboarding)
      // 400 might also mean no records found or query syntax error
      if (error.status === 404) {
        return { success: true, data: null as any }
      }
      
      // For 400 errors, check if it's a "no records" or permission issue
      if (error.status === 400) {
        const errorData = error.data || {}
        const errorMsg = errorData.message || error.message || 'Invalid query or no records found'
        
        // Log the actual error data structure
        console.error('400 Error Data:', JSON.stringify(errorData, null, 2))
        
        // Check if it's a permission/rule issue
        if (errorMsg.includes('permission') || errorMsg.includes('rule') || errorMsg.includes('auth') || errorMsg.includes('Something went wrong')) {
          console.error('Permission/Query error - This might be a PocketBase API rule issue')
          console.error('Attempting to return null to allow app to continue...')
          // For "Something went wrong" errors, it's often a query/rule issue
          // Return null to allow the app to continue (session will be created during onboarding)
          return { success: true, data: null as any }
        }
        
        // If it's likely a "no records" case, return null
        if (errorMsg.includes('No records') || errorMsg.includes('not found') || errorMsg.includes('empty')) {
          return { success: true, data: null as any }
        }
        
        // For other 400 errors, return null anyway to prevent app breakage
        // The session will be created during onboarding if needed
        console.warn('Unknown 400 error, returning null to allow app to continue')
        return { success: true, data: null as any }
      }
      
      return { success: false, error: error.message || 'Failed to fetch session' }
    }
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
      console.error('Error creating or getting session:', error)
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
            status: nextDay > 10 ? 'completed' : 'in_progress',
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

