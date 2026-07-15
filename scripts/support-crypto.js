/**
 * Support chat field encryption (AES-256-GCM).
 * Ciphertext format: sm1.<iv_b64url>.<ciphertext+tag_b64url>
 * Key stays on the API server only — never ship to the app bundle.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const PREFIX = 'sm1'

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromB64url(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64')
}

/** 32-byte key from SUPPORT_CHAT_KEY, or HKDF-ish derive from PB_ENCRYPTION_KEY. */
export function getSupportChatKey() {
  const raw = (process.env.SUPPORT_CHAT_KEY || '').trim()
  if (raw) {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex')
    const asB64 = Buffer.from(raw, 'base64')
    if (asB64.length === 32) return asB64
    return createHash('sha256').update(raw, 'utf8').digest()
  }
  const fallback = (process.env.PB_ENCRYPTION_KEY || '').trim()
  if (!fallback) return null
  // ponytail: derive until SUPPORT_CHAT_KEY is set — ceiling is shared PB key reuse
  return createHash('sha256').update(`smono-support-chat-v1:${fallback}`, 'utf8').digest()
}

export function isSupportCryptoReady() {
  return Boolean(getSupportChatKey())
}

export function isEncryptedBlob(value) {
  return typeof value === 'string' && value.startsWith(`${PREFIX}.`)
}

export function encryptSupportText(plaintext) {
  const key = getSupportChatKey()
  if (!key) throw new Error('SUPPORT_CHAT_KEY not configured')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(String(plaintext ?? ''), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}.${b64url(iv)}.${b64url(Buffer.concat([enc, tag]))}`
}

/** Decrypt sm1 blobs; pass through legacy plaintext unchanged. */
export function decryptSupportText(value) {
  if (value == null || value === '') return ''
  if (!isEncryptedBlob(value)) return String(value)
  const key = getSupportChatKey()
  if (!key) throw new Error('SUPPORT_CHAT_KEY not configured')
  const parts = String(value).split('.')
  if (parts.length !== 3 || parts[0] !== PREFIX) throw new Error('Invalid ciphertext')
  const iv = fromB64url(parts[1])
  const packed = fromB64url(parts[2])
  if (packed.length < 17) throw new Error('Invalid ciphertext')
  const tag = packed.subarray(packed.length - 16)
  const data = packed.subarray(0, packed.length - 16)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
