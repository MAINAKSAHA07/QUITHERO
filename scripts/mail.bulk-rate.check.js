/**
 * ponytail: gmail bulk needs rate limit or only first recipient delivers
 */
import assert from 'node:assert/strict'
import { smtpConfigFromEnv, resetMailTransporter } from './mail.js'

resetMailTransporter()
process.env.SMTP_HOST = 'smtp.gmail.com'
process.env.SMTP_USER = 'x@gmail.com'
process.env.SMTP_PASS = 'x'
process.env.SMTP_FROM = 'x@gmail.com'
resetMailTransporter()

const cfg = smtpConfigFromEnv()
assert.equal(cfg.pool, true)
assert.equal(cfg.maxConnections, 1)
assert.equal(cfg.rateLimit, 1)
assert.equal(cfg.rateDelta, 1000)

process.env.SMTP_HOST = 'smtp.example.com'
const cfg2 = smtpConfigFromEnv()
assert.equal(cfg2.rateLimit, 5)

console.log('mail.bulk-rate.check OK')
