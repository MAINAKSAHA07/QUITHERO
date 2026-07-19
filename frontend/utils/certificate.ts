/** Smoke-free certificate copy helpers. */

export function canIssueCertificate(quitDate?: string | null): boolean {
  return Boolean(quitDate && String(quitDate).trim())
}

export function certificateDaysLabel(days: number): string {
  const n = Math.max(0, Math.floor(Number(days) || 0))
  return n === 1 ? '1 day smoke-free' : `${n} days smoke-free`
}

export function formatCertificateDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
