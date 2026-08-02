/**
 * Shared entitlement writes — Razorpay + Store IAP must use the same fields.
 * On first transition to active, send purchase confirmation email (best-effort).
 */
import { adminAuth, getPbUrl } from './pb-admin.js'
import { sendPurchaseConfirmationEmail, sendWelcomeEmail } from './lifecycle-email.js'

export async function activateSubscription(userId, country, options = {}) {
  const token = await adminAuth()
  if (!token) throw new Error('Admin auth unavailable — cannot activate subscription')

  const pb = getPbUrl()
  const filter = encodeURIComponent(`user = "${userId}"`)
  const list = await fetch(`${pb}/api/collections/user_profiles/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: token },
  })
  if (!list.ok) throw new Error('Failed to load user profile')
  const data = await list.json()
  let profile = data.items?.[0]
  const wasActive = profile?.subscription_status === 'active'

  const payload = {
    subscription_status: 'active',
    subscription_started_at: new Date().toISOString(),
    subscription_country: country || profile?.subscription_country || profile?.country || 'IN',
  }

  let result
  if (!profile?.id) {
    const created = await fetch(`${pb}/api/collections/user_profiles/records`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userId, ...payload }),
    })
    if (!created.ok) {
      const err = await created.text().catch(() => '')
      throw new Error(`Failed to create profile for unlock: ${err || created.status}`)
    }
    result = await created.json()
  } else {
    const patch = await fetch(`${pb}/api/collections/user_profiles/records/${profile.id}`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!patch.ok) {
      const err = await patch.text().catch(() => '')
      throw new Error(`Failed to activate subscription: ${err || patch.status}`)
    }
    result = await patch.json()
  }

  // Idempotent: webhook + claim both call activate — only email once when newly unlocked
  if (!wasActive && !options.suppressPurchaseEmail) {
    sendWelcomeEmail(userId).catch((err) => {
      console.error('[welcome-email]', err?.message || err)
    })
    sendPurchaseConfirmationEmail(userId).catch((err) => {
      console.error('[purchase-email]', err?.message || err)
    })
  }

  return result
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
