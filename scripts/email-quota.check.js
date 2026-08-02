/**
 * A quota refusal must stop the batch, not fail every remaining address.
 * Regression guard: 59 recipients were silently dropped when Gmail's daily
 * cap hit mid-send and the loop kept grinding through the rest.
 */
import assert from 'node:assert/strict'
import { isSendQuotaError } from './email-api.js'

// The exact refusal Gmail returned when the cap was reached.
assert.equal(
  isSendQuotaError(
    'Data command failed: 550-5.4.5 Daily user sending limit exceeded. For more information on Gmail sending limits go to'
  ),
  true
)
assert.equal(isSendQuotaError('454 4.7.0 Too many messages, try again later'), true)
assert.equal(isSendQuotaError('421 4.7.0 rate limit exceeded'), true)

// A bad address is that address's problem — the batch must carry on.
assert.equal(isSendQuotaError('550 5.1.1 No such user here'), false)
assert.equal(isSendQuotaError('Invalid recipient'), false)
assert.equal(isSendQuotaError(''), false)
assert.equal(isSendQuotaError(undefined), false)

console.log('email-quota.check OK')
