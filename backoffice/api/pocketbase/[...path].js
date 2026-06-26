/**
 * Vercel Serverless Function to proxy PocketBase requests.
 * Allows HTTPS frontends to communicate with HTTP PocketBase backend.
 */

const PB_URL = (process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://54.153.95.239:8096').replace(/\/$/, '')

function getPbPath(req) {
  const segments = req.query.path
  if (segments) {
    return Array.isArray(segments) ? segments.join('/') : String(segments)
  }

  const rawUrl = req.url || ''
  const match = rawUrl.match(/\/api\/pocketbase\/(.+?)(\?|$)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function buildQueryString(req) {
  const queryParams = { ...req.query }
  delete queryParams.path

  const pairs = []
  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const item of value) pairs.push([key, String(item)])
    } else {
      pairs.push([key, String(value)])
    }
  }

  const queryString = new URLSearchParams(pairs).toString()
  return queryString ? `?${queryString}` : ''
}

export default async function handler(req, res) {
  const pbPath = getPbPath(req)
  if (!pbPath) {
    return res.status(400).json({ error: 'Missing PocketBase API path' })
  }

  const url = `${PB_URL}/${pbPath}${buildQueryString(req)}`

  try {
    const headers = { Accept: 'application/json' }
    if (req.headers.authorization) headers.Authorization = req.headers.authorization
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type']

    let body
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    })

    const data = await response.text()
    const contentType = response.headers.get('content-type') || ''

    res.status(response.status)
    if (contentType.includes('application/json')) {
      try {
        return res.json(JSON.parse(data))
      } catch {
        return res.send(data)
      }
    }

    return res.send(data)
  } catch (error) {
    console.error('PocketBase proxy error:', error)
    return res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
    })
  }
}
