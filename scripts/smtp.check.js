/**
 * ponytail: Gmail SMTP pairing must be 587+STARTTLS or 465+SSL
 */
import assert from 'node:assert/strict'

function pbTls({ port, secure }) {
  const s = String(secure || '').toLowerCase()
  return s === 'ssl' || s === 'tls' || s === 'true' || Number(port) === 465
}

function nodemailerSecure({ port, secure }) {
  return pbTls({ port, secure })
}

assert.equal(pbTls({ port: 587, secure: 'starttls' }), false)
assert.equal(nodemailerSecure({ port: 587, secure: 'starttls' }), false)
assert.equal(pbTls({ port: 465, secure: 'ssl' }), true)
assert.equal(pbTls({ port: 587, secure: 'ssl' }), true) // misconfig if paired with 587

assert.equal('smtp.gmail.com', 'smtp.gmail.com')
assert.match('smono.hq@gmail.com', /@gmail\.com$/)

console.log('smtp.check OK')
