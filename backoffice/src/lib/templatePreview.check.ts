/**
 * ponytail: preview must treat full HTML docs as html, plain as branded wrap
 */
import assert from 'node:assert/strict'
import {
  looksLikeHtml,
  templatePreviewSrcDoc,
  escapeHtmlForPreview,
  wrapPlainEmailPreview,
} from './templatePreview'

assert.equal(looksLikeHtml('<p>Hi</p>'), true)
assert.equal(looksLikeHtml('<!DOCTYPE html><html><body>x</body></html>'), true)
assert.equal(looksLikeHtml('Hello {{user.name}}'), false)

assert.match(escapeHtmlForPreview('<script>'), /&lt;script&gt;/)
assert.match(templatePreviewSrcDoc('<h1>Hi</h1>'), /<h1>Hi<\/h1>/)
assert.match(templatePreviewSrcDoc('Just text <notag'), /Just text/)
assert.match(templatePreviewSrcDoc('Hi {{user.name}}', { title: 'A moment for you' }), /A moment for you/)
assert.match(templatePreviewSrcDoc('Hi {{user.name}}'), /#3F8DD2/)
assert.match(wrapPlainEmailPreview('Hello\n\nWorld', { title: 'Title' }), /Hello/)

console.log('templatePreview.check OK')
