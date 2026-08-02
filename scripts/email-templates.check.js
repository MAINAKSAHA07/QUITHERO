/**
 * ponytail: email layout must stay simple — one CTA, brand tokens, no junk chrome
 */
import assert from 'node:assert/strict'
import {
  renderSmonoEmail,
  wrapPlainEmail,
  htmlToPlainText,
  isFullHtmlDocument,
  pbAuthEmailBodies,
  buildBlogLaunchEmail,
  buildPurchaseEmail,
  buildDailyReminderEmail,
  buildDeletionAcceptedEmail,
  seedEmailTemplateDefs,
  applyEmailTemplateVars,
} from './email-templates.js'

const html = renderSmonoEmail({
  title: 'Your journey is still here',
  preheader: 'Continue when ready',
  bodyHtml: '<p>Hello</p>',
  ctaLabel: 'Continue',
  ctaUrl: 'https://app.smono.app',
})

assert.match(html, /Smono/)
assert.match(html, /Your journey is still here/)
assert.match(html, /Continue/)
assert.match(html, /#3F8DD2/)
assert.equal((html.match(/border-radius:14px/g) || []).length >= 1, true)
assert.equal(html.includes('gradient'), false) // keep calm, no flashy fills

const wrapped = wrapPlainEmail('Hi Ada,\n\nCome back when ready.', {
  title: 'A note from Smono',
  ctaLabel: 'Open app',
  ctaUrl: 'https://app.smono.app',
})
assert.match(wrapped, /Hi Ada/)
assert.match(wrapped, /<p[^>]*>Come back when ready\.<\/p>/)

const auth = pbAuthEmailBodies()
assert.match(auth.reset.body, /confirm-password-reset\?token=\{TOKEN\}/)
assert.match(auth.reset.body, /\{APP_URL\}/)
assert.match(auth.verification.subject, /Smono/)

const blog = buildBlogLaunchEmail({
  title: ' How to ride out a craving ',
  excerpt: 'Three calm steps.',
  slug: '/how-to-ride-out-a-craving/',
})
assert.equal(blog.ctaUrl, 'https://www.smono.app/blog/how-to-ride-out-a-craving/')
assert.match(blog.subject, /How to ride out a craving/)
assert.match(blog.text, /Three calm steps/)

const purchase = buildPurchaseEmail({ name: 'Ada Lovelace' })
assert.match(purchase.subject, /full access/i)
assert.match(purchase.text, /Hi Ada/)
assert.equal(purchase.ctaUrl, 'https://app.smono.app')

const deletion = buildDeletionAcceptedEmail({ name: 'Ada Lovelace' })
assert.match(deletion.subject, /deletion request was accepted/i)
assert.match(deletion.text, /Hi Ada/)
assert.match(deletion.text, /look forward to hearing from you again/i)
assert.match(deletion.text, /journey/i)
assert.equal(deletion.ctaUrl, 'https://www.smono.app')

const reminder = buildDailyReminderEmail({
  name: 'Ada',
  quote: 'Breathe once.',
  reminderTime: '09:00',
})
assert.match(reminder.text, /Breathe once/)
assert.match(reminder.subject, /check-in/i)

assert.equal(
  applyEmailTemplateVars('Hi {{user.name}}, {{quote}}', {
    'user.name': 'Ada',
    quote: 'Breathe once.',
  }),
  'Hi Ada, Breathe once.'
)
assert.equal(
  applyEmailTemplateVars('Hi {{user.name}}', { user: { name: 'Ada' } }),
  'Hi Ada'
)
assert.equal(applyEmailTemplateVars('x {{missing}} y', {}), 'x  y')

const seeded = seedEmailTemplateDefs()
for (const ev of [
  'purchase_success',
  'daily_reminder',
  'segment_reminder',
  'account_deletion_accepted',
]) {
  assert.equal(
    seeded.some((t) => t.trigger_event === ev),
    true,
    `missing seed ${ev}`
  )
}
const daily = seeded.find((t) => t.trigger_event === 'daily_reminder')
assert.ok(daily)
assert.equal(isFullHtmlDocument(daily.content), false, 'daily seed must be plain body')
assert.match(daily.content, /\{\{user\.name\}\}/)
assert.match(daily.content, /\{\{quote\}\}/)
assert.equal(daily.from_email, 'support@smono.app')
assert.equal((daily.content.match(/Smono/g) || []).length <= 1, true)

assert.equal(isFullHtmlDocument('<!DOCTYPE html><html><body>x</body></html>'), true)
assert.equal(isFullHtmlDocument('<p>Hello</p>'), false)
assert.match(htmlToPlainText('<p>Hi <b>Ada</b></p><br>Bye'), /Hi Ada/)
assert.match(htmlToPlainText('<p>Hi <b>Ada</b></p><br>Bye'), /Bye/)

console.log('email-templates.check OK')
