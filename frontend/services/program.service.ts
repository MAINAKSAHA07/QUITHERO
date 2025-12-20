import { BaseService } from './base.service'
import { Program, ProgramDay, Step } from '../types/models'
import { ApiResponse } from '../types/api'

export class ProgramService extends BaseService {
  constructor() {
    super('programs')
  }

  /**
   * Get active program for language
   */
  async getActiveProgram(language: string = 'en'): Promise<ApiResponse<Program>> {
    try {
      const result = await this.getFirst(`is_active = true && language = "${language}"`, {
        sort: 'order',
      })
      return result
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get all program days for a program
   */
  async getProgramDays(programId: string): Promise<ApiResponse<ProgramDay[]>> {
    try {
      const result = await pb.collection('program_days').getFullList({
        filter: `program = "${programId}"`,
        sort: 'day_number',
        expand: 'program',
      })
      return { success: true, data: result as any as ProgramDay[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get steps for a program day
   */
  async getSteps(programDayId: string): Promise<ApiResponse<Step[]>> {
    try {
      const result = await pb.collection('steps').getFullList({
        filter: `program_day = "${programDayId}"`,
        sort: 'order',
        expand: 'program_day',
      })
      return { success: true, data: result as any as Step[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get program day by ID
   */
  async getProgramDayById(programDayId: string): Promise<ApiResponse<ProgramDay>> {
    try {
      const result = await pb.collection('program_days').getOne(programDayId, {
        expand: 'program',
      })
      return { success: true, data: result as any as ProgramDay }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get program day by day number
   */
  async getProgramDayByNumber(programId: string, dayNumber: number): Promise<ApiResponse<ProgramDay>> {
    try {
      const result = await pb.collection('program_days').getFirstListItem(
        `program = "${programId}" && day_number = ${dayNumber}`,
        { expand: 'program' }
      )
      return { success: true, data: result as any as ProgramDay }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Import pb for direct collection access
import { pb } from '../lib/pocketbase'

export const programService = new ProgramService()

