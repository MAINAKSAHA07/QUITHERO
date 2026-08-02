/**
 * ponytail: firebase config shape — uses placeholders, never real keys in git
 */
import assert from 'node:assert/strict'

const cfg = {
  apiKey: 'test-firebase-api-key',
  authDomain: 'example.firebaseapp.com',
  projectId: 'example-project',
  storageBucket: 'example-project.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:abcdef0123456789',
  measurementId: 'G-TESTMEASURE',
}

for (const [k, v] of Object.entries(cfg)) {
  assert.ok(typeof v === 'string' && v.length > 0, `missing ${k}`)
}
assert.match(cfg.measurementId, /^G-/)
assert.match(cfg.appId, /^1:/)
assert.equal(cfg.apiKey.includes('AIza'), false, 'check must not embed a real Google API key')

console.log('firebase.check OK')
