/**
 * Runnable check: npx tsx frontend/utils/certificate.check.ts
 */
import {
  canIssueCertificate,
  certificateDaysLabel,
  formatCertificateDate,
} from './certificate'

console.assert(canIssueCertificate(null) === false)
console.assert(canIssueCertificate('') === false)
console.assert(canIssueCertificate('2026-01-01') === true)
console.assert(certificateDaysLabel(0) === '0 days smoke-free')
console.assert(certificateDaysLabel(1) === '1 day smoke-free')
console.assert(certificateDaysLabel(30) === '30 days smoke-free')
console.assert(formatCertificateDate('2026-07-18').includes('2026'))
console.log('certificate.check: ok')
