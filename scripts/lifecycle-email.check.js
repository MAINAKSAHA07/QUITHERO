/**
 * ponytail: purchase email only on first unlock (not already-active)
 */
import assert from 'node:assert/strict'
import { buildPurchaseEmail } from './email-templates.js'

function shouldSendPurchaseEmail(wasActive) {
  return !wasActive
}

assert.equal(shouldSendPurchaseEmail(false), true)
assert.equal(shouldSendPurchaseEmail(true), false)
assert.equal(shouldSendPurchaseEmail(undefined), true)

const mail = buildPurchaseEmail({ name: 'Test User' })
assert.match(mail.ctaUrl, /app\.smono\.app/)
assert.match(mail.text, /Hi Test/)

console.log('lifecycle-email.check OK')
