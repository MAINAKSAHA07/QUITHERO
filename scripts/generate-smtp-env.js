#!/usr/bin/env node
/**
 * Prints Gmail SMTP values for smono.hq@gmail.com (PocketBase Mailer + API .env).
 * Password cannot be invented — create a Google App Password, then paste it.
 *
 * Run: npm run generate:smtp
 */
const SENDER = process.env.SMTP_FROM || 'smono.hq@gmail.com'

const lines = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  SMTP_SECURE: 'starttls',
  SMTP_USER: SENDER,
  SMTP_PASS: '<PASTE_GOOGLE_APP_PASSWORD_HERE>',
  SMTP_FROM: SENDER,
  SMTP_FROM_NAME: 'Smono',
  SMTP_LOCAL_NAME: 'smono.app',
}

console.log(`
PocketBase Mailer UI — fill exactly:

  Enable                 ✓
  Sender address         ${SENDER}
  SMTP server host       smtp.gmail.com
  SMTP server port       587
  SMTP account username  ${SENDER}
  SMTP account password  (Google App Password — 16 chars, no spaces)
  SMTP security mode     STARTTLS   ← not SSL when using port 587
                         (or: port 465 + SSL)

Google App Password (required — Gmail blocks normal passwords):
  1. Sign in as ${SENDER}
  2. Google Account → Security → 2-Step Verification (turn on)
  3. App passwords → Mail → Other ("Smono") → Generate
  4. Paste the 16-character password into SMTP_PASS / the PB form

Add to .env (server only — never VITE_):
`)

for (const [k, v] of Object.entries(lines)) {
  console.log(`${k}=${v}`)
}

console.log(`
Then apply to PocketBase:
  npm run pb:setup-smtp

Test from API (after api-server restart):
  curl -s http://127.0.0.1:8787/api/email/health
`)
