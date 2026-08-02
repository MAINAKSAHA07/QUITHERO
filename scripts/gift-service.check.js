import assert from 'node:assert/strict'
import {
  hashGiftClaimToken,
  makeGiftClaimToken,
  normalizeGiftEmail,
  validateGiftDetails,
} from './gift-service.js'
import { buildGiftBuyerEmail, buildGiftRecipientEmail } from './email-templates.js'

assert.equal(normalizeGiftEmail('  Person@Example.COM '), 'person@example.com')
assert.equal(
  validateGiftDetails({
    buyer_email: 'same@example.com',
    recipient_email: 'SAME@example.com',
  }).ok,
  false,
  'buyer and recipient must differ'
)
assert.equal(
  validateGiftDetails({
    buyer_email: 'buyer@example.com',
    recipient_email: 'recipient@example.com',
  }).ok,
  true
)

const buyerToken = makeGiftClaimToken('order_test', 'buyer')
const recipientToken = makeGiftClaimToken('order_test', 'recipient')
assert.notEqual(buyerToken, recipientToken)
assert.equal(hashGiftClaimToken(buyerToken), hashGiftClaimToken(buyerToken))
assert.notEqual(hashGiftClaimToken(buyerToken), hashGiftClaimToken(recipientToken))

const buyerMail = buildGiftBuyerEmail({
  buyerName: 'Alex',
  recipientName: 'Sam',
  recipientEmail: 'sam@example.com',
})
assert.match(buyerMail.text, /Sam/)
assert.match(buyerMail.text, /Only they can claim/i)
assert.doesNotMatch(buyerMail.text, /access for you/i)
assert.equal(buyerMail.ctaLabel, 'Learn about Smono')

const recipientMail = buildGiftRecipientEmail({
  recipientName: 'Sam',
  buyerName: 'Alex',
  message: 'I am with you.',
  claimUrl: 'https://app.smono.app/claim-gift?token=recipient',
})
assert.match(recipientMail.text, /I am with you/)
assert.match(recipientMail.ctaUrl, /recipient/)

assert.notEqual(
  hashGiftClaimToken(makeGiftClaimToken('order_x', 'buyer')),
  hashGiftClaimToken(makeGiftClaimToken('order_x', 'recipient'))
)

console.log('gift-service.check OK')
