/**
 * Fix password-reset + verification email HTML (Apple-simple layout) and app meta.
 * Run: node PocketBase/setup-password-reset.js
 */
import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'
import { pbAuthEmailBodies, renderSmonoEmail, BRAND } from '../scripts/email-templates.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const APP_URL = (process.env.PUBLIC_URL || BRAND.appUrl).replace(/\/$/, '')
const ADMIN_URL = (process.env.ADMIN_PUBLIC_URL || 'https://admin.smono.app').replace(/\/$/, '')

async function auth() {
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  }
}

async function main() {
  await auth()
  const mail = pbAuthEmailBodies()

  await pb.settings.update({
    meta: {
      appName: 'Smono',
      appURL: APP_URL,
      senderName: process.env.SMTP_FROM_NAME || 'Smono',
      senderAddress: process.env.SMTP_FROM || process.env.SMTP_USER || 'smono.hq@gmail.com',
    },
  })
  console.log(`✓ meta.appName=Smono meta.appURL=${APP_URL}`)

  const users = await pb.collections.getOne('users')
  await pb.collections.update(users.id, {
    resetPasswordTemplate: mail.reset,
    verificationTemplate: mail.verification,
    confirmEmailChangeTemplate: mail.emailChange,
    // No “login from a new location” emails — noisy for normal app use
    authAlert: { enabled: false },
  })
  console.log('✓ users auth email templates (reset / verify / email-change)')
  console.log('✓ users authAlert disabled')

  // PocketBase Admin UI (_superusers) — was still emailing "Login from a new location"
  try {
    const supers = await pb.collections.getOne('_superusers')
    await pb.collections.update(supers.id, { authAlert: { enabled: false } })
    console.log('✓ _superusers authAlert disabled')
  } catch (e) {
    console.warn('_superusers authAlert skip:', e.message)
  }

  try {
    const admins = await pb.collections.getOne('admin_users')
    const adminReset = {
      subject: 'Reset your Smono Admin password',
      body: renderSmonoEmail({
        title: 'Reset your admin password',
        preheader: 'Choose a new password for Smono Admin.',
        bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${BRAND.text};">
          We received a request to reset your Smono Admin password. Tap below to choose a new one.
        </p>`,
        ctaLabel: 'Choose new password',
        ctaUrl: `${ADMIN_URL}/confirm-password-reset?token={TOKEN}`,
        footerNote: 'If you didn’t ask for this, ignore this email.',
      }),
    }
    await pb.collections.update(admins.id, {
      resetPasswordTemplate: adminReset,
      authAlert: { enabled: false },
    })
    console.log(`✓ admin_users reset → ${ADMIN_URL}/confirm-password-reset`)
    console.log('✓ admin_users authAlert disabled')
  } catch (e) {
    console.warn('admin_users template skip:', e.message)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
