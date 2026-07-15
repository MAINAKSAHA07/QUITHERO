/**
 * ponytail: assert support-crypto roundtrip — fails if AES-GCM packing breaks
 */
import assert from 'assert'
import { encryptSupportText, decryptSupportText, isEncryptedBlob } from './support-crypto.js'

process.env.SUPPORT_CHAT_KEY =
  process.env.SUPPORT_CHAT_KEY ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

const sample = 'Support: user needs help with billing 💳'
const ct = encryptSupportText(sample)
assert.ok(isEncryptedBlob(ct), 'ciphertext must use sm1 prefix')
assert.notStrictEqual(ct, sample, 'must not store plaintext')
assert.strictEqual(decryptSupportText(ct), sample, 'roundtrip')
assert.strictEqual(decryptSupportText('old plaintext'), 'old plaintext', 'legacy pass-through')
assert.notStrictEqual(encryptSupportText(sample), ct, 'unique IV per encrypt')
console.log('support-crypto.check OK')
