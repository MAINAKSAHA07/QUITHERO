/**
 * Admin-only: grant / revoke full unlocked program access.
 * Reuses the same subscription fields as payment activation.
 */
import { getAuthAdmin } from './pb-admin.js'
import { activateSubscription, expireSubscription } from './subscription-activate.js'

function bearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || ''
  const m = String(h).match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : String(h).trim()
}

async function readJson(req, readBody) {
  const buf = await readBody(req)
  if (!buf?.length) return {}
  try {
    return JSON.parse(buf.toString('utf8'))
  } catch {
    return null
  }
}

/**
 * POST /api/admin/grant-access  { userId, country? }
 * POST /api/admin/revoke-access { userId }
 */
export async function handleAdminAccessApi(req, res, pathname, readBody, json) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'method_not_allowed' })
    return
  }

  const admin = await getAuthAdmin(bearer(req))
  if (!admin?.id) {
    json(res, 401, { error: 'unauthorized' })
    return
  }

  const body = await readJson(req, readBody)
  if (!body) {
    json(res, 400, { error: 'invalid_json' })
    return
  }

  const userId = String(body.userId || '').trim()
  if (!userId) {
    json(res, 400, { error: 'userId_required' })
    return
  }

  try {
    if (pathname === '/api/admin/grant-access') {
      const country = body.country ? String(body.country).trim() : undefined
      const profile = await activateSubscription(userId, country)
      console.error(
        `[admin-access] grant user=${userId} by=${admin.id} (${admin.email || 'admin'})`
      )
      json(res, 200, {
        ok: true,
        action: 'granted',
        subscription_status: profile.subscription_status,
        subscription_started_at: profile.subscription_started_at,
        subscription_country: profile.subscription_country,
      })
      return
    }

    if (pathname === '/api/admin/revoke-access') {
      const profile = await expireSubscription(userId)
      console.error(
        `[admin-access] revoke user=${userId} by=${admin.id} (${admin.email || 'admin'})`
      )
      json(res, 200, {
        ok: true,
        action: 'revoked',
        subscription_status: profile.subscription_status,
      })
      return
    }

    json(res, 404, { error: 'not_found' })
  } catch (err) {
    console.error('[admin-access]', err.message)
    json(res, 500, { error: err.message || 'grant_failed' })
  }
}
