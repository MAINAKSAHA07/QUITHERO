import { UserProfile } from '../types/models'

/** True when the user already finished KYC / onboarding (including legacy profiles). */
export function isKycComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false
  if (profile.onboarding_completed_at) return true
  // ponytail: fallback for fully completed legacy profiles
  if (profile.quit_archetype && profile.daily_consumption && profile.quit_date) return true
  return false
}

export function postAuthPath(profile: UserProfile | null | undefined): '/home' | '/kyc' {
  return isKycComplete(profile) ? '/home' : '/kyc'
}
