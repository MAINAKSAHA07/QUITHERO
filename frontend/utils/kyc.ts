import { UserProfile } from '../types/models'

/** True when the user already finished KYC / onboarding (including legacy profiles). */
export function isKycComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false
  if (profile.onboarding_completed_at) return true
  // Legacy / partial saves: archetype + quit date is enough signal they finished KYC
  if (profile.quit_archetype && profile.quit_date) return true
  // Older profiles that never got onboarding_completed_at or archetype enum
  if (
    profile.quit_date &&
    ((Array.isArray(profile.smoking_triggers) && profile.smoking_triggers.length > 0) ||
      (Array.isArray(profile.emotional_states) && profile.emotional_states.length > 0) ||
      (typeof profile.daily_consumption === 'number' && profile.daily_consumption > 0))
  ) {
    return true
  }
  return false
}

export function postAuthPath(profile: UserProfile | null | undefined): '/home' | '/kyc' {
  return isKycComplete(profile) ? '/home' : '/kyc'
}
