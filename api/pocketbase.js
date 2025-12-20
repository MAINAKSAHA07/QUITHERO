/**
 * Vercel Serverless Function to proxy PocketBase requests for Frontend
 * This allows HTTPS frontend to communicate with HTTP PocketBase backend
 */

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://54.153.95.239:8096'

export default async function handler(req, res) {
  // Get the path and query from the request
  const { path = '', ...queryParams } = req.query

  // Reconstruct the full PocketBase URL
  const pbPath = Array.isArray(path) ? path.join('/') : path
  const queryString = new URLSearchParams(queryParams).toString()
  const url = `${PB_URL}/${pbPath}${queryString ? `?${queryString}` : ''}`

  try {
    // Forward the request to PocketBase
    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(PB_URL).host,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    // Get response data
    const data = await response.text()
    let jsonData
    try {
      jsonData = JSON.parse(data)
    } catch {
      jsonData = data
    }

    // Forward PocketBase response headers
    const headers = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Send response
    res.status(response.status)
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    if (typeof jsonData === 'object') {
      res.json(jsonData)
    } else {
      res.send(jsonData)
    }
  } catch (error) {
    console.error('PocketBase proxy error:', error)
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    })
  }
}
