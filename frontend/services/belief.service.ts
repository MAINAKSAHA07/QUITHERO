import { pb } from '../lib/pocketbase'
import { ApiResponse } from '../types/api'

export interface BeliefAssessmentData {
  id?: string
  user: string
  assessment_day: number // 0, 15, or 30
  belief_relaxation: number // 0-10
  belief_enjoyment: number // 0-10
  belief_concentration: number // 0-10
  belief_social: number // 0-10
  belief_stress_relief: number // 0-10
  total_score?: number
  created?: string
}

export interface BeliefDelta {
  label: string
  key: string
  day0: number
  latest: number
  delta: number
}

class BeliefService {
  private collection = 'belief_assessments'

  async createAssessment(data: Omit<BeliefAssessmentData, 'id' | 'created'>): Promise<ApiResponse<BeliefAssessmentData>> {
    try {
      const record = await pb.collection(this.collection).create(data)
      return { success: true, data: record as unknown as BeliefAssessmentData }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to save belief assessment' }
    }
  }

  async getAll(userId: string): Promise<ApiResponse<BeliefAssessmentData[]>> {
    try {
      const records = await pb.collection(this.collection).getFullList({
        filter: `user="${userId}"`,
        sort: 'assessment_day',
      })
      return { success: true, data: records as unknown as BeliefAssessmentData[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async hasAssessmentForDay(userId: string, day: number): Promise<boolean> {
    try {
      await pb.collection(this.collection).getFirstListItem(
        `user="${userId}" && assessment_day=${day}`
      )
      return true
    } catch {
      return false
    }
  }

  async getBeliefDelta(userId: string): Promise<ApiResponse<BeliefDelta[]>> {
    try {
      const records = await pb.collection(this.collection).getFullList({
        filter: `user="${userId}"`,
        sort: 'assessment_day',
      }) as unknown as BeliefAssessmentData[]

      if (records.length < 2) {
        return { success: true, data: [] }
      }

      const day0 = records.find(r => r.assessment_day === 0)
      const latest = records[records.length - 1]

      if (!day0 || day0 === latest) {
        return { success: true, data: [] }
      }

      const labels: Record<string, string> = {
        belief_relaxation: 'Smoking relaxes me',
        belief_enjoyment: 'I enjoy smoking',
        belief_concentration: 'It helps me concentrate',
        belief_social: 'I need it socially',
        belief_stress_relief: 'It relieves my stress',
      }

      const deltas: BeliefDelta[] = Object.entries(labels).map(([key, label]) => ({
        label,
        key,
        day0: (day0 as any)[key] ?? 0,
        latest: (latest as any)[key] ?? 0,
        delta: ((latest as any)[key] ?? 0) - ((day0 as any)[key] ?? 0),
      }))

      return { success: true, data: deltas }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const beliefService = new BeliefService()
