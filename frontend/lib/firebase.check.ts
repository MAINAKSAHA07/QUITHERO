/**
 * ponytail: firebase config must stay complete for SDK init
 */
import assert from 'node:assert/strict'

const cfg = {
  apiKey: '',
  authDomain: 'smono-54134.firebaseapp.com',
  projectId: 'smono-54134',
  storageBucket: 'smono-54134.firebasestorage.app',
  messagingSenderId: '969689528370',
  appId: '1:969689528370:web:1158185fb363228b03242b',
  measurementId: 'G-H4ZFZ7N46P',
}

for (const [k, v] of Object.entries(cfg)) {
  assert.ok(typeof v === 'string' && v.length > 0, `missing ${k}`)
}
assert.match(cfg.measurementId, /^G-/)
assert.match(cfg.appId, /^1:/)

console.log('firebase.check OK')
