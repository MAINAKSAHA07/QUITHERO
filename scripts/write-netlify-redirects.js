/**
 * Writes Netlify _redirects into dist/ after build so /api/pocketbase/* proxies
 * to PocketBase instead of falling through to index.html (which breaks OAuth).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function resolveNetlifyPbProxyTarget() {
  const raw = (
    process.env.NETLIFY_PB_PROXY_TARGET ||
    process.env.VITE_POCKETBASE_URL ||
    process.env.AWS_POCKETBASE_URL ||
    'http://54.153.95.239:8096'
  ).replace(/\/$/, '')

  // Netlify proxies server-side — EC2 port 8096 is often closed. Route via nginx :80 instead.
  if (/^https?:\/\/[^/:]+:8096$/i.test(raw)) {
    return raw.replace(':8096', '/api/pocketbase')
  }

  return raw
}

function resolveNetlifyPushProxyTarget() {
  const raw = (
    process.env.NETLIFY_PUSH_PROXY_TARGET ||
    process.env.AWS_PUBLIC_URL ||
    'http://54.153.95.239'
  ).replace(/\/$/, '')
  return raw.startsWith('http') ? raw : `http://${raw}`
}

const pbUrl = resolveNetlifyPbProxyTarget()
const pushUrl = resolveNetlifyPushProxyTarget()

const distDir = path.join(root, 'dist')
if (!fs.existsSync(distDir)) {
  console.warn('[write-netlify-redirects] dist/ not found — skipping')
  process.exit(0)
}

const redirects = `# Auto-generated — do not edit
# OAuth return page (avoids PocketBase popup+SSE flow that breaks behind Netlify)
/api/pocketbase/api/oauth2-redirect  /oauth-callback.html  200

# PocketBase API proxy
/api/pocketbase/*  ${pbUrl}/:splat  200

# AI personalization proxy → Netlify Function
/api/ai/personalize  /.netlify/functions/ai-personalize  200

# Web Push API → EC2 (background reminders when app is closed)
/api/push/*  ${pushUrl}/api/push/:splat  200

# SPA fallback
/*  /index.html  200
`

fs.writeFileSync(path.join(distDir, '_redirects'), redirects)
console.log(`[write-netlify-redirects] PocketBase proxy → ${pbUrl}`)
console.log(`[write-netlify-redirects] Push API proxy → ${pushUrl}/api/push`)
