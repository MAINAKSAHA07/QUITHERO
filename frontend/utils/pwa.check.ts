/**
 * Install prompt only on mobile browser — not desktop, not native, not PWA shell.
 * Soft dismiss is session-scoped so we can ask again next visit.
 */
import assert from 'node:assert/strict'
import {
  isAndroidDevice,
  isIosDevice,
  isMobileDevice,
  isStandalonePwa,
  shouldOfferInstallPrompt,
  isInstallMarkedDone,
  INSTALL_SESSION_DISMISS_KEY,
  NOTIF_SESSION_DISMISS_KEY,
} from './pwa.ts'

assert.equal(typeof isIosDevice(), 'boolean')
assert.equal(typeof isAndroidDevice(), 'boolean')
assert.equal(typeof isMobileDevice(), 'boolean')
assert.equal(typeof isStandalonePwa(), 'boolean')
assert.equal(shouldOfferInstallPrompt(false), false)
assert.equal(shouldOfferInstallPrompt(true), false)
assert.equal(isInstallMarkedDone(), false)
assert.equal(typeof INSTALL_SESSION_DISMISS_KEY, 'string')
assert.equal(typeof NOTIF_SESSION_DISMISS_KEY, 'string')

console.log('pwa.check.ts: ok')
