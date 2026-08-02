import {
  mergeRecipients,
  parseEmailList,
  htmlBodyToText,
  composeFromEmailTemplate,
} from './parseEmailList'

console.assert(parseEmailList('a@b.com, c@d.com').join(',') === 'a@b.com,c@d.com')
console.assert(parseEmailList('a@b.com\nc@d.com; a@b.com').length === 2)
console.assert(parseEmailList('not-an-email').length === 0)
console.assert(
  mergeRecipients(['A@B.com'], 'c@d.com, a@b.com').join(',') === 'a@b.com,c@d.com'
)
console.assert(htmlBodyToText('<p>Hi <b>Ada</b></p>').includes('Hi Ada'))
console.assert(htmlBodyToText('Just plain').includes('Just plain'))

const plain = composeFromEmailTemplate({
  trigger_event: 'daily_reminder',
  name: 'Daily reminder',
  content: 'Hi {{user.name}},\n\n{{quote}}\n\nOpen the app.',
})
console.assert(plain.title === 'A moment for you', 'plain uses compose title')
console.assert(plain.body.includes('{{quote}}'), 'plain keeps body vars')
console.assert(plain.body.includes('Open the app'), 'plain keeps body')
console.assert(plain.ctaLabel === 'Open Smono')

const legacy = composeFromEmailTemplate({
  trigger_event: 'daily_reminder',
  name: 'Daily reminder',
  content: `<!DOCTYPE html><html><body>
    <div style="display:none">{{quote}}</div>
    <p>Smono</p>
    <h1>A moment for you</h1>
    <p>Hi {{user.name}},</p>
    <p>{{quote}}</p>
    <p>This is your daily reminder. Open the app for today’s session.</p>
    <a href="https://app.smono.app" style="display:inline-block">Open Smono</a>
    <p>You’re getting this because daily reminders are on. Turn them off anytime in Profile.</p>
  </body></html>`,
})
console.assert(legacy.title === 'A moment for you', 'legacy title from h1')
console.assert(legacy.body.includes('Hi {{user.name}}'), 'legacy keeps greeting')
console.assert(legacy.body.includes('{{quote}}'), 'legacy keeps quote once in body')
console.assert(!/^Smono$/m.test(legacy.body.trim().split('\n')[0]), 'legacy drops brand line')
console.assert(
  (legacy.body.match(/\{\{quote\}\}/g) || []).length === 1,
  'legacy drops hidden preheader quote'
)
console.assert(legacy.ctaLabel === 'Open Smono')
console.assert(legacy.ctaUrl === 'https://app.smono.app')

console.log('parseEmailList.check: ok')
