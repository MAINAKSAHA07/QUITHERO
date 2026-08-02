/**
 * Preset reminder copy for segment email — keyed by predefined segment or "custom".
 */
const APP = 'https://app.smono.app'

export type SegmentEmailDraft = {
  subject: string
  title: string
  text: string
  preheader: string
  ctaLabel: string
  ctaUrl: string
}

export function segmentReminderPreset(
  segmentKey: string,
  segmentName: string
): SegmentEmailDraft {
  const name = segmentName || 'your group'
  const presets: Record<string, SegmentEmailDraft> = {
    inactive: {
      subject: 'Your quit journey is still here',
      title: 'No judgment — just a nudge',
      text: 'It’s been quiet for a bit. That’s okay. Your progress is saved, and one short session is enough to restart momentum.',
      preheader: 'Pick up where you left off',
      ctaLabel: 'Continue my program',
      ctaUrl: APP,
    },
    churned: {
      subject: 'Come back when you’re ready',
      title: 'We’re still here',
      text: 'Life gets loud. Whenever you want to restart, Smono picks up with you — no reset shame, no streak guilt.',
      preheader: 'Your account and progress are waiting',
      ctaLabel: 'Open Smono',
      ctaUrl: APP,
    },
    'high-risk': {
      subject: 'A calm check-in from Smono',
      title: 'Slips don’t erase progress',
      text: 'If cravings have been loud lately, you’re not alone. Open the app for a short support session — built for exactly this moment.',
      preheader: 'Support when it feels hard',
      ctaLabel: 'Get support now',
      ctaUrl: APP,
    },
    'star-performers': {
      subject: 'You’re doing the hard part',
      title: 'Keep the streak of clarity',
      text: 'You’ve put in real work. A quick check-in today helps lock in what you’ve already built.',
      preheader: 'One short session to stay sharp',
      ctaLabel: 'Open today’s session',
      ctaUrl: APP,
    },
    'new-users': {
      subject: 'Day one energy — start here',
      title: 'Welcome — start small',
      text: 'You just joined Smono. Open the app and begin with Day 1 when you have ten quiet minutes.',
      preheader: 'Your personalised quit program is ready',
      ctaLabel: 'Start Day 1',
      ctaUrl: APP,
    },
    'kyc-completed': {
      subject: 'Your plan is personalised — open it',
      title: 'Everything’s set up',
      text: 'Your profile is complete. The next step is simple: open Smono and start the session waiting for you.',
      preheader: 'Your program is ready',
      ctaLabel: 'Open my program',
      ctaUrl: APP,
    },
    active: {
      subject: 'A quick reminder from Smono',
      title: 'Keep showing up',
      text: 'You’re already in motion. A short session today keeps the habit of quitting stronger than the habit of smoking.',
      preheader: 'Continue while momentum is with you',
      ctaLabel: 'Continue',
      ctaUrl: APP,
    },
  }

  return (
    presets[segmentKey] || {
      subject: `A note for ${name}`,
      title: 'A reminder from Smono',
      text: `This message is for people in “${name}”. Open the app when you’re ready — your program meets you where you are.`,
      preheader: `Reminder for ${name}`,
      ctaLabel: 'Open Smono',
      ctaUrl: APP,
    }
  )
}
