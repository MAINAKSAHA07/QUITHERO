/**
 * Shared entitlement writes — Razorpay + Store IAP must use the same fields.
 */
import { adminAuth, getPbUrl } from './pb-admin.js'

export async function activateSubscription(userId, country) {
  const token = await adminAuth()
  if (!token) throw new Error('Admin auth unavailable — cannot activate subscription')

  const pb = getPbUrl()
  const filter = encodeURIComponent(`user = "${userId}"`)
  const list = await fetch(`${pb}/api/collections/user_profiles/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: token },
  })
  if (!list.ok) throw new Error('Failed to load user profile')
  const data = await list.json()
  const profile = data.items?.[0]
  if (!profile?.id) throw new Error('User profile not found')

  const patch = await fetch(`${pb}/api/collections/user_profiles/records/${profile.id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription_status: 'active',
      subscription_started_at: new Date().toISOString(),
      subscription_country: country || profile.subscription_country || 'IN',
    }),
  })
  if (!patch.ok) {
    const err = await patch.text().catch(() => '')
    throw new Error(`Failed to activate subscription: ${err || patch.status}`)
  }
  return patch.json()
}

export async function expireSubscription(userId) {
  const token = await adminAuth()
  if (!token) throw new Error('Admin auth unavailable — cannot expire subscription')

  const pb = getPbUrl()
  const filter = encodeURIComponent(`user = "${userId}"`)
  const list = await fetch(`${pb}/api/collections/user_profiles/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: token },
  })
  if (!list.ok) throw new Error('Failed to load user profile')
  const data = await list.json()
  const profile = data.items?.[0]
  if (!profile?.id) throw new Error('User profile not found')

  const patch = await fetch(`${pb}/api/collections/user_profiles/records/${profile.id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_status: 'expired' }),
  })
  if (!patch.ok) {
    const err = await patch.text().catch(() => '')
    throw new Error(`Failed to expire subscription: ${err || patch.status}`)
  }
  return patch.json()
}
