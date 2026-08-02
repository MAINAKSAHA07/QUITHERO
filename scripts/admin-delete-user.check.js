/**
 * ponytail: deletion acceptance mail must bypass marketing kill-switch
 */
import assert from 'node:assert/strict'
import { buildDeletionAcceptedEmail } from './email-templates.js'

const mail = buildDeletionAcceptedEmail({ name: 'Punit Rao' })
assert.match(mail.subject, /deletion request was accepted/i)
assert.match(mail.text, /Hi Punit/)
assert.match(mail.text, /look forward to hearing from you again/i)

console.log('admin-delete-user.check OK')
