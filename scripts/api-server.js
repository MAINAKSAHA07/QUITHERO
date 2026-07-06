/**
 * EC2 API server — AI personalization + Web Push (nginx → localhost).
 * Routes: POST /api/ai/personalize, GET /api/push/vapid-public-key, POST /api/push/subscribe
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
} from './push.js'
import { getAuthUser } from './pb-admin.js'
import { startReminderScheduler } from './reminder-scheduler.js'

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

    let userId = ''
    const auth = req.headers.authorization
    if (auth) {
      const user = await getAuthUser(auth)
      if (user?.id) userId = user.id
    }

    try {
      const record = await savePushSubscription({ subscription, userId })
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
    json(res, 404, { error: 'not_found' })
  } catch (err) {
    console.error('[api-server]', err.message)
    json(res, 500, { error: 'server_error' })
  }
})

initWebPush()
startReminderScheduler()

server.listen(PORT, '127.0.0.1', () => {
  const hasAi = Boolean(process.env.ANTHROPIC_API_KEY)
  const hasPush = isPushReady()
  console.error(
    `[api-server] 127.0.0.1:${PORT} ai=${hasAi ? 'on' : 'off'} push=${hasPush ? 'on' : 'off'}`
  )
})
