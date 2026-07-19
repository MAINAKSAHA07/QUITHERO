/**
 * EC2 API server — AI personalization + Web Push (nginx → localhost).
 * Routes: POST /api/ai/personalize, /api/push/*, /api/support/* (encrypted chat)
 */
import http from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import aiHandler from '../netlify/functions/ai-personalize.js'
import {
  getVapidPublicKey,
  initWebPush,
  isPushReady,
  savePushSubscription,
  removePushSubscription,
  notifyUserPush,
  saveDeviceToken,
  removeDeviceToken,
} from './push.js'
import { getAuthUser, getAuthAdmin, adminAuth, getPbUrl } from './pb-admin.js'
import { startReminderScheduler } from './reminder-scheduler.js'
import { startSmokeCheckScheduler } from './smoke-check-scheduler.js'
import { handleSupportApi } from './support-api.js'
import { isSupportCryptoReady } from './support-crypto.js'
import { handleRazorpayApi, isRazorpayReady } from './razorpay-api.js'
import { handleRazorpayWebhook, isWebhookConfigured } from './razorpay-webhook.js'
import { handleIapApi, isIapReady } from './iap-api.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const stripped = t.startsWith('export ') ? t.slice(7) : t
    const eq = stripped.indexOf('=')
    if (eq === -1) continue
    const key = stripped.slice(0, eq).trim()
    let val = stripped.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

loadEnvFile(join(root, '.env'))

const PORT = Number(process.env.AI_PROXY_PORT || 8787)

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

async function handleAiPersonalize(req, res) {
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req)
  const request = new Request(`http://127.0.0.1/api/ai/personalize`, {
    method: req.method,
    headers: req.headers,
    body,
  })
  const response = await aiHandler(request)
  const headers = Object.fromEntries(response.headers.entries())
  res.writeHead(response.status, headers)
  response.arrayBuffer().then((buf) => res.end(Buffer.from(buf))).catch(() => res.end())
}

async function handlePush(req, res, pathname) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (pathname === '/api/push/vapid-public-key' && req.method === 'GET') {
    const publicKey = getVapidPublicKey()
    if (!publicKey) return json(res, 503, { error: 'Push not configured' })
    return json(res, 200, { ok: true, publicKey })
  }

  if (pathname === '/api/push/health' && req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      push: isPushReady(),
      hasVapid: Boolean(getVapidPublicKey()),
    })
  }

  if (pathname === '/api/push/subscribe' && req.method === 'POST') {
    if (!isPushReady()) return json(res, 503, { error: 'Push not configured' })
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    const { subscription } = body
    if (!subscription?.endpoint) return json(res, 400, { error: 'subscription required' })

    const auth = req.headers.authorization
    if (!auth) return json(res, 401, { error: 'Login required' })

    const user = await getAuthUser(auth)
    if (!user?.id) return json(res, 401, { error: 'Invalid or expired session' })

    try {
      const record = await savePushSubscription({ subscription, userId: user.id })
      return json(res, 200, { ok: true, record })
    } catch (err) {
      console.error('[push/subscribe]', err.message)
      return json(res, 500, { error: err.message || 'subscribe failed' })
    }
  }

  if (pathname === '/api/push/unsubscribe' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    if (!body.endpoint) return json(res, 400, { error: 'endpoint required' })
    await removePushSubscription(body.endpoint)
    return json(res, 200, { ok: true })
  }

  if (pathname === '/api/push/register-device' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    const auth = req.headers.authorization
    if (!auth) return json(res, 401, { error: 'Login required' })
    const user = await getAuthUser(auth)
    if (!user?.id) return json(res, 401, { error: 'Invalid or expired session' })
    const token = String(body.token || '').trim()
    const platform = String(body.platform || '').toLowerCase()
    if (!token) return json(res, 400, { error: 'token required' })
    try {
      const record = await saveDeviceToken({ token, platform, userId: user.id })
      return json(res, 200, { ok: true, record })
    } catch (err) {
      console.error('[push/register-device]', err.message)
      return json(res, 500, { error: err.message || 'register failed' })
    }
  }

  if (pathname === '/api/push/unregister-device' && req.method === 'POST') {
    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }
    if (!body.token) return json(res, 400, { error: 'token required' })
    await removeDeviceToken(body.token)
    return json(res, 200, { ok: true })
  }

  // Admin-only: send web push to a user (retention win-back, etc.)
  if (pathname === '/api/push/notify' && req.method === 'POST') {
    if (!isPushReady()) return json(res, 503, { error: 'Push not configured' })
    const auth = req.headers.authorization
    if (!auth) return json(res, 401, { error: 'Admin login required' })
    const admin = await getAuthAdmin(auth)
    if (!admin?.id) return json(res, 401, { error: 'Invalid or expired admin session' })

    let body
    try {
      body = JSON.parse((await readBody(req)).toString() || '{}')
    } catch {
      return json(res, 400, { error: 'Invalid JSON' })
    }

    const userId = String(body.userId || '').trim()
    const title = String(body.title || 'We miss you').trim().slice(0, 80)
    const message = String(body.body || body.message || 'Come back and continue your quit journey.').trim().slice(0, 200)
    const url = String(body.url || '/home').trim().slice(0, 120)
    const tag = String(body.tag || 'winback').trim().slice(0, 40)

    if (!userId) return json(res, 400, { error: 'userId required' })

    try {
      const result = await notifyUserPush(userId, { title, body: message, url, tag })
      const sent = result.sent || 0

      // Audit trail — best-effort
      try {
        const token = await adminAuth()
        if (token) {
          await fetch(`${getPbUrl()}/api/collections/notification_events/records`, {
            method: 'POST',
            headers: { Authorization: token, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: userId,
              trigger_type: 'winback_push',
              message_title: title,
              message_body: message,
              sent_at: new Date().toISOString(),
              day_number: Number(body.dayNumber) || 0,
            }),
          }).catch(() => null)
        }
      } catch {
        /* ignore audit failure */
      }

      if (sent === 0) {
        const msg =
          result.error === 'no_subscriptions'
            ? 'No active push subscriptions for this user. They need to enable notifications in the app (Profile → Daily reminders).'
            : `Push delivery failed (${result.error || 'unknown'}). Try again or ask the user to re-enable notifications.`
        return json(res, 404, {
          ok: false,
          sent: 0,
          attempted: result.attempted || 0,
          error: msg,
        })
      }
      return json(res, 200, { ok: true, sent, attempted: result.attempted })
    } catch (err) {
      console.error('[push/notify]', err.message)
      return json(res, 500, { error: err.message || 'notify failed' })
    }
  }

  json(res, 404, { error: 'not_found' })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  try {
    if (url.pathname === '/api/ai/personalize') {
      await handleAiPersonalize(req, res)
      return
    }
    if (url.pathname.startsWith('/api/push/')) {
      await handlePush(req, res, url.pathname)
      return
    }
    if (url.pathname.startsWith('/api/support/')) {
      await handleSupportApi(req, res, url.pathname, url.searchParams, readBody, json)
      return
    }
    if (url.pathname === '/api/create-order' || url.pathname === '/api/verify-payment' || url.pathname === '/api/preview-coupon') {
      await handleRazorpayApi(req, res, url.pathname, readBody, json)
      return
    }
    if (url.pathname === '/api/razorpay/webhook') {
      await handleRazorpayWebhook(req, res, readBody, json)
      return
    }
    if (url.pathname.startsWith('/api/iap/')) {
      await handleIapApi(req, res, url.pathname, readBody, json)
      return
    }
    json(res, 404, { error: 'not_found' })
  } catch (err) {
    console.error('[api-server]', err.message)
    json(res, 500, { error: 'server_error' })
  }
})

initWebPush()
startReminderScheduler()
startSmokeCheckScheduler()

server.listen(PORT, '127.0.0.1', () => {
  const hasAi = Boolean(process.env.ANTHROPIC_API_KEY)
  const hasPush = isPushReady()
  console.error(
    `[api-server] 127.0.0.1:${PORT} ai=${hasAi ? 'on' : 'off'} push=${hasPush ? 'on' : 'off'} supportCrypto=${isSupportCryptoReady() ? 'on' : 'off'} razorpay=${isRazorpayReady() ? 'on' : 'off'} webhook=${isWebhookConfigured() ? 'on' : 'off'} iap=${isIapReady() ? 'on' : 'off'}`
  )
})
