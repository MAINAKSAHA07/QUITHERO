import { UserProfile } from '../types/models'

/** True when the user finished the full onboarding / KYC flow */
export function isKycComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false
  if (profile.onboarding_completed_at) return true
  return !!(profile.quit_archetype && profile.daily_consumption)
}
