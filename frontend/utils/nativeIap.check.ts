/**
 * ponytail: native IAP bridge must not activate on web
 */
import assert from 'assert'
import { Capacitor } from '@capacitor/core'

assert.equal(Capacitor.isNativePlatform(), false)
console.log('nativeIap.web-gate.check OK')
