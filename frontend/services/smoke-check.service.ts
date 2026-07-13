import { pb } from '../lib/pocketbase'
import { ApiResponse } from '../types/api'
import { SmokeCheckIn } from '../types/models'
import { CravingTrigger, CravingType } from '../types/enums'
import { cravingService } from './craving.service'
import { sessionService } from './session.service'
import { programService } from './program.service'
import {
  isSmokeCheckDue,
  isPastQuitDay,
  periodsElapsedSinceAnchor,
  smokeCheckAnchor,
  aggregateCheckInStats,
  SMOKE_CHECK_PERIODS_PER_DAY,
} from '../utils/smokeCheckTiming'

export type SmokeCheckSubmitResult = {
  checkIn: SmokeCheckIn
  periodsCredited: number
}

/** Smoke check-ins start after day 1 session step 3 (last_step_index is the next step). */
export const SMOKE_CHECK_MIN_DAY1_STEPS = 3

export class SmokeCheckService {
  /** True once user has advanced past step 2 on program day 1. */
  async isUnlocked(userId: string, _language = 'en'): Promise<boolean> {
    try {
      const session = await sessionService.getCurrentSession(userId)
      if (!session.success || !session.data) return false

      const programId =
        typeof session.data.program === 'string'
          ? session.data.program
          : (session.data.program as { id?: string })?.id
      if (!programId) return false

      let dayResult = await programService.getProgramDayByNumber(programId, 1)
      if (!dayResult.success || !dayResult.data?.id) return false

      const progress = await sessionService.getSessionProgress(userId, dayResult.data.id)
      const stepIndex = progress.data?.last_step_index ?? 0
      return stepIndex >= SMOKE_CHECK_MIN_DAY1_STEPS
    } catch {
      return false
    }
  }

  async getLastCheckIn(userId: string): Promise<ApiResponse<SmokeCheckIn | null>> {
    try {
      const row = await pb
        .collection('smoke_check_ins')
        .getFirstListItem(`user = "${userId}"`, { sort: '-responded_at' })
        .catch(() => null)
      return { success: true, data: (row as unknown as SmokeCheckIn) || null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getAllCheckIns(userId: string): Promise<ApiResponse<SmokeCheckIn[]>> {
    try {
      const rows = await pb.collection('smoke_check_ins').getFullList({
        filter: `user = "${userId}"`,
        fields: 'smoked,periods_credited,responded_at',
        sort: 'responded_at',
      })
      return { success: true, data: (rows || []) as unknown as SmokeCheckIn[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getAggregatedStats(userId: string) {
    const result = await this.getAllCheckIns(userId)
    if (!result.success || !result.data) {
      return { success: false as const, error: result.error }
    }
    const stats = aggregateCheckInStats(result.data)
    return { success: true as const, data: stats }
  }

  async countSmokeFreePeriods(userId: string): Promise<ApiResponse<number>> {
    try {
      const agg = await this.getAggregatedStats(userId)
      if (!agg.success) return { success: false, error: agg.error }
      return { success: true, data: agg.data.totalPeriods }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async isDue(userId: string, quitDate: string | undefined): Promise<boolean> {
    if (!quitDate || !isPastQuitDay(quitDate)) return false
    const last = await this.getLastCheckIn(userId)
    const lastAt = last.success ? last.data?.responded_at : undefined
    return isSmokeCheckDue(quitDate, lastAt)
  }

  async submit(
    userId: string,
    quitDate: string,
    smoked: boolean,
    source: 'in_app' | 'push' = 'in_app'
  ): Promise<ApiResponse<SmokeCheckSubmitResult>> {
    try {
      const now = new Date()
      const last = await this.getLastCheckIn(userId)
      const anchor = smokeCheckAnchor(quitDate, last.data?.responded_at)
      if (!anchor) {
        return { success: false, error: 'Quit date not set' }
      }

      const periodsCredited = smoked ? 0 : periodsElapsedSinceAnchor(anchor, now)
      const periodStart = anchor.toISOString()
      const periodEnd = now.toISOString()

      const created = await pb.collection('smoke_check_ins').create({
        user: userId,
        smoked: Boolean(smoked),
        periods_credited: periodsCredited,
        period_start: periodStart,
        period_end: periodEnd,
        responded_at: periodEnd,
        source,
      })

      if (smoked) {
        try {
          await cravingService.create({
            user: userId,
            type: CravingType.SLIP,
            intensity: 3,
            trigger: CravingTrigger.HABIT,
            notes: 'Logged via smoke check-in',
          })
        } catch (cravingErr) {
          console.warn('[SmokeCheck] Craving log failed:', cravingErr)
        }
      }

      return {
        success: true,
        data: { checkIn: created as unknown as SmokeCheckIn, periodsCredited },
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.smoked?.message ||
        error?.message ||
        'Unknown error'
      return { success: false, error: message }
    }
  }

  /** Convert confirmed smoke-free periods → display stats inputs */
  static statsFromPeriods(smokeFreePeriods: number, dailyConsumption: number) {
    const daysSmokeFree = smokeFreePeriods / SMOKE_CHECK_PERIODS_PER_DAY
    const cigarettesPerPeriod = dailyConsumption / SMOKE_CHECK_PERIODS_PER_DAY
    const cigarettesNotSmoked = Math.round(smokeFreePeriods * cigarettesPerPeriod)
    return { daysSmokeFree, cigarettesNotSmoked }
  }
}

export const smokeCheckService = new SmokeCheckService()
