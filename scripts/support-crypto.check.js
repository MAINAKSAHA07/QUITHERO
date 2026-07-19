/**
 * ponytail: support decrypt must not throw on bad blobs (wipes inbox)
 */
import assert from 'assert'
import { decryptSupportText, encryptSupportText, isEncryptedBlob } from './support-crypto.js'

process.env.SUPPORT_CHAT_KEY =
  process.env.SUPPORT_CHAT_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

const plain = 'hello support'
const enc = encryptSupportText(plain)
assert.equal(isEncryptedBlob(enc), true)
assert.equal(decryptSupportText(enc), plain)
assert.equal(decryptSupportText('legacy plaintext'), 'legacy plaintext')

let threw = false
try {
  decryptSupportText('sm1.bad.cipher')
} catch {
  threw = true
}
assert.equal(threw, true)

console.log('support-crypto.check OK')
