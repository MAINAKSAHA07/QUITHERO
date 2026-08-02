import assert from 'node:assert/strict'
import { getMetaPixelId } from './meta-pixel.js'

assert.equal(getMetaPixelId(), '2020960708540154')
console.log('meta-pixel.check OK')
