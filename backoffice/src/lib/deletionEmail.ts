/** Acceptance email when admin deletes a user account. */

const SITE_URL = 'https://www.smono.app'

export function buildDeletionAcceptedEmail({ name }: { name?: string } = {}) {
  const first = String(name || 'there').trim().split(/\s+/)[0] || 'there'
  return {
    subject: 'Your Smono account deletion request was accepted',
    text: [
      `Hi ${first},`,
      '',
      'Your request to delete your Smono account has been accepted. Your account and program data have been removed.',
      '',
      'We look forward to hearing from you again — and we’d be glad to see you on your journey whenever you’re ready.',
      '',
      'If you need anything, reply to this email or write to support@smono.app.',
      '',
      '— Smono',
    ].join('\n'),
    title: 'Request accepted',
    preheader: 'Your account has been deleted. The door stays open if you return.',
    ctaLabel: 'Visit Smono',
    ctaUrl: SITE_URL,
  }
}
