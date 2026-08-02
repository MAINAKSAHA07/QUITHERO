import { pb, adminCollectionHelpers } from './pocketbase'

export type CoachAccessResult =
  | { ok: true; enable_coach_chat: boolean }
  | { ok: false; error: string }

/** Toggle beta Coach chatbot for a user (direct PB). */
export async function setCoachChatAccess(opts: {
  userId: string
  enable: boolean
  profileId?: string | null
}): Promise<CoachAccessResult> {
  if (!pb.authStore.isValid) {
    return { ok: false, error: 'Admin session expired. Sign in again.' }
  }

  const payload = { enable_coach_chat: opts.enable }

  try {
    let profileId = opts.profileId || null
    if (!profileId) {
      const listed = await adminCollectionHelpers.getFullList('user_profiles', {
        filter: `user = "${opts.userId}"`,
        fields: 'id',
      })
      profileId = (listed.data?.[0] as { id?: string } | undefined)?.id || null
    }

    if (profileId) {
      const result = await adminCollectionHelpers.update('user_profiles', profileId, payload)
      if (!result.success) {
        return {
          ok: false,
          error: result.error || 'Failed to update coach access (is enable_coach_chat on user_profiles?)',
        }
      }
    } else if (opts.enable) {
      const create = await adminCollectionHelpers.create('user_profiles', {
        user: opts.userId,
        ...payload,
      })
      if (!create.success) {
        return { ok: false, error: create.error || 'Failed to create profile' }
      }
    } else {
      return { ok: false, error: 'User has no profile to update' }
    }

    return { ok: true, enable_coach_chat: opts.enable }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Update failed' }
  }
}
