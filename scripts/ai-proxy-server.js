/**
 * EC2 AI proxy — serves netlify/functions/ai-personalize.js on localhost.
 * nginx forwards POST /api/ai/personalize here.
 *
 * Run: npm run ai-proxy
 * Env: AI_PROXY_PORT (default 8787), ANTHROPIC_API_KEY from .env
 */

import http from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import handler from '../netlify/functions/ai-personalize.js'

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
const PATH = '/api/ai/personalize'

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function sendResponse(res, response) {
  const headers = Object.fromEntries(response.headers.entries())
  res.writeHead(response.status, headers)
  response.arrayBuffer().then(buf => res.end(Buffer.from(buf))).catch(() => res.end())
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  if (url.pathname !== PATH) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found' }))
    return
  }

  try {
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req)
    const request = new Request(`http://127.0.0.1${PATH}`, {
      method: req.method,
      headers: req.headers,
      body,
    })
    sendResponse(res, await handler(request))
  } catch (err) {
    console.error('[ai-proxy] handler error:', err.message)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'proxy_error', fallback: true }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY)
  console.error(`[ai-proxy] listening on 127.0.0.1:${PORT}${PATH}${hasKey ? '' : ' (ANTHROPIC_API_KEY missing)'}`)
})
