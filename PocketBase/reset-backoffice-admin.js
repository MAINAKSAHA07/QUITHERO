#!/usr/bin/env node
/**
 * Reset or create a backoffice admin_users record (not PocketBase superuser).
 * Usage: BACKOFFICE_ADMIN_EMAIL=x BACKOFFICE_ADMIN_PASSWORD=y node PocketBase/reset-backoffice-admin.js
 */
import { loadEnv, getPocketBaseURL, getAdminEmail, getAdminPassword } from './utils.js'

loadEnv()

const PB_URL = getPocketBaseURL()
const superEmail = getAdminEmail()
const superPassword = getAdminPassword()
const adminEmail = process.env.BACKOFFICE_ADMIN_EMAIL || 'admin@backoffice.com'
const adminPassword =
  process.env.BACKOFFICE_ADMIN_PASSWORD ||
  process.env.AWS_PB_ADMIN_PASSWORD ||
  process.env.PB_ADMIN_PASSWORD

if (!adminPassword) {
  console.error('Set BACKOFFICE_ADMIN_PASSWORD (or AWS_PB_ADMIN_PASSWORD) in .env')
  process.exit(1)
}

async function superAuth() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: superEmail, password: superPassword }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Superuser auth failed: ${err.message || res.status}`)
  }
  return res.json()
}

async function main() {
  const { token } = await superAuth()
  const headers = { Authorization: token, 'Content-Type': 'application/json' }

  const filter = encodeURIComponent(`email = "${adminEmail}"`)
  const list = await fetch(`${PB_URL}/api/collections/admin_users/records?filter=${filter}`, { headers })
  const data = await list.json()
  const existing = data.items?.[0]

  const body = {
    email: adminEmail,
    name: existing?.name || 'Backoffice Admin',
    role: existing?.role || 'admin',
    verified: true,
    password: adminPassword,
    passwordConfirm: adminPassword,
  }

  if (existing) {
    const res = await fetch(`${PB_URL}/api/collections/admin_users/records/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Update failed')
    console.log(`✓ Updated backoffice admin: ${adminEmail}`)
  } else {
    const res = await fetch(`${PB_URL}/api/collections/admin_users/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Create failed')
    console.log(`✓ Created backoffice admin: ${adminEmail}`)
  }

  const auth = await fetch(`${PB_URL}/api/collections/admin_users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: adminEmail, password: adminPassword }),
  })
  if (!auth.ok) throw new Error('Password reset OK but login test failed')
  console.log('✓ Login test passed')
}

main().catch((e) => {
  console.error('✗', e.message)
  process.exit(1)
})
