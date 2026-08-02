/**
 * Apply SMTP + sender to PocketBase settings (Mailer).
 * Run: node PocketBase/setup-smtp.js
 *
 * Requires SMTP_* in .env (see npm run generate:smtp).
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

async function auth() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }
}

function required(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name} in .env`)
  return v
}

async function main() {
  await auth()

  const host = required('SMTP_HOST')
  const port = Number(process.env.SMTP_PORT || 587)
  const username = required('SMTP_USER')
  const password = required('SMTP_PASS')
  const from = process.env.SMTP_FROM || username
  const fromName = process.env.SMTP_FROM_NAME || 'Smono'
  const secureEnv = (process.env.SMTP_SECURE || '').toLowerCase()
  // PocketBase: tls=true enforces TLS; false = STARTTLS (use with 587)
  const tls =
    secureEnv === 'ssl' || secureEnv === 'tls' || secureEnv === 'true' || port === 465

  const patch = {
    meta: {
      senderName: fromName,
      senderAddress: from,
    },
    smtp: {
      enabled: true,
      host,
      port,
      username,
      password,
      tls,
      authMethod: 'PLAIN',
      localName: process.env.SMTP_LOCAL_NAME || 'smono.app',
    },
  }

  const updated = await pb.settings.update(patch)
  console.log('✓ PocketBase SMTP enabled')
  console.log(`  host=${updated.smtp?.host}:${updated.smtp?.port}`)
  console.log(`  sender=${updated.meta?.senderAddress} (${updated.meta?.senderName})`)
  console.log(`  tls=${updated.smtp?.tls} (false = STARTTLS on 587)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
