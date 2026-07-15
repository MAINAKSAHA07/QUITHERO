/**
 * ponytail: media URL normalization — fails if PB absolute file URLs aren't proxied
 */
import assert from 'assert'
import { resolveMediaUrl, isEmbedVideoUrl } from './mediaUrl.ts'

assert.equal(resolveMediaUrl(''), '')
assert.equal(
  resolveMediaUrl('http://54.1.2.3:8096/api/files/media/abc123/photo.webp'),
  '/api/pocketbase/api/files/media/abc123/photo.webp'
)
assert.equal(
  resolveMediaUrl('/api/pocketbase/api/files/media/abc123/photo.webp'),
  '/api/pocketbase/api/files/media/abc123/photo.webp'
)
assert.equal(
  resolveMediaUrl('/api/files/media/abc123/photo.webp'),
  '/api/pocketbase/api/files/media/abc123/photo.webp'
)
assert.equal(isEmbedVideoUrl('https://www.youtube.com/watch?v=x'), true)
assert.equal(resolveMediaUrl('https://www.youtube.com/embed/x'), 'https://www.youtube.com/embed/x')

console.log('mediaUrl.check OK')
