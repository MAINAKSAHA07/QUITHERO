import { pb, adminCollectionHelpers } from './pocketbase'

export type AccessActionResult =
  | { ok: true; action: 'granted' | 'revoked'; subscription_status: string }
  | { ok: false; error: string }

/**
 * Grant / revoke full program access via PocketBase admin session.
 * Avoids /api/admin/* (405 when that proxy isn't on the backoffice host).
 */
export async function setUserFullAccess(opts: {
  userId: string
  grant: boolean
  country?: string
  profileId?: string | null
}): Promise<AccessActionResult> {
  if (!pb.authStore.isValid) {
    return { ok: false, error: 'Admin session expired. Sign in again.' }
  }

  const country = opts.country || 'IN'
  const payload: Record<string, string> = opts.grant
    ? {
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        subscription_country: country,
      }
    : { subscription_status: 'expired' }

  try {
    let profileId = opts.profileId || null
    let rowCountry: string | undefined

    if (!profileId) {
      const listed = await adminCollectionHelpers.getFullList('user_profiles', {
        filter: `user = "${opts.userId}"`,
        fields: 'id,subscription_status,subscription_country,country',
      })
      const row = listed.data?.[0] as
        | { id?: string; subscription_country?: string; country?: string }
        | undefined
      profileId = row?.id || null
      rowCountry = row?.subscription_country || row?.country
    }

    if (opts.grant && rowCountry) {
      payload.subscription_country = rowCountry
    }

    if (profileId) {
      const result = await adminCollectionHelpers.update('user_profiles', profileId, payload)
      if (!result.success) {
        return {
          ok: false,
          error:
            result.error ||
            'Failed to update subscription (is subscription_status on user_profiles?)',
        }
      }
    } else if (opts.grant) {
      const create = await adminCollectionHelpers.create('user_profiles', {
        user: opts.userId,
        ...payload,
      })
      if (!create.success) {
        return { ok: false, error: create.error || 'Failed to create profile' }
      }
    } else {
      return { ok: false, error: 'User has no profile to revoke' }
    }

    return {
      ok: true,
      action: opts.grant ? 'granted' : 'revoked',
      subscription_status: payload.subscription_status,
    }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Update failed' }
  }
}
