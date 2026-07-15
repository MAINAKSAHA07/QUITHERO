/**
 * ponytail: handwriting language gate — fails if CJK gets Kalam or HI loses it
 */
import assert from 'assert'
import { usesHandwritingFont } from './handwritingLang.ts'

assert.equal(usesHandwritingFont('en'), true)
assert.equal(usesHandwritingFont('hi'), true)
assert.equal(usesHandwritingFont('mr'), true)
assert.equal(usesHandwritingFont('zh'), false)
assert.equal(usesHandwritingFont('gu'), false)
assert.equal(usesHandwritingFont(null), true)

console.log('handwritingLang.check OK')
