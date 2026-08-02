/** Shared SEO copy — keep in sync with visible on-page content. */
export const SITE_URL = 'https://www.smono.app'
export const APP_URL = 'https://app.smono.app'
/** 1200×630 share card — never use the wide wordmark alone (crawlers crop it). */
export const OG_IMAGE = `${SITE_URL}/og-image.png`

/** Trailing-slash paths (matches prerendered `…/index.html` folders). */
export function canonicalPath(path: string): string {
  if (!path || path === '/') return '/'
  const p = path.startsWith('/') ? path : `/${path}`
  return p.endsWith('/') ? p : `${p}/`
}

/** Absolute canonical URL on the marketing host. */
export function pageUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${canonicalPath(path)}`
}

/** Single coherent story: 10-day quit + 20-day support = 30-day path */
export const PROGRAM_FRAMING =
  '10-day quit program with 20 days of smoke-free support (30 days total)'

export const SEO_TITLE = 'A 10-Day Program to Help You Quit Smoking | Smono'

export const SEO_DESCRIPTION =
  'Smono is a personalised quit-smoking app: remove the desire to smoke in 10 days, then stay free with 20 days of support (30 days total). CBT, mindfulness, and relapse prevention — no patches or willpower wars.'

export const FAQ_ITEMS = [
  {
    question: 'Do I have to stop smoking immediately?',
    answer:
      'No. Smono does not force you to quit on Day 1. In the early part of the program, you can continue smoking while completing the lessons and exercises. This helps reduce pressure and prepares your mind for the final cigarette.',
  },
  {
    question: 'How long does the program take?',
    answer:
      'Smono is a 30-day path: a 10-day quit program followed by 20 days of smoke-free support, mindfulness, and relapse prevention.',
  },
  {
    question: 'Will I need willpower?',
    answer:
      'You will need willingness, but Smono is not built around willpower battles. The program is designed to reduce the desire to smoke by changing how you think and feel about cigarettes.',
  },
  {
    question: 'Do I need nicotine gums, patches, or vapes?',
    answer:
      'No. Smono does not use nicotine substitutes. The goal is freedom from nicotine, not replacing one nicotine source with another.',
  },
  {
    question: 'What if I have tried quitting before?',
    answer:
      'That is exactly who Smono is built for. Many smokers fail because they try to force themselves to stop while still believing cigarettes give them something valuable. Smono works on those beliefs first.',
  },
  {
    question: 'What if I smoke because of stress?',
    answer:
      'Smono helps you understand the difference between true stress relief and nicotine relief. You will also learn mindfulness and nervous system tools to handle stressful moments without smoking.',
  },
  {
    question: 'What if my friends smoke?',
    answer:
      'You do not have to avoid every smoker or stop living your life. Smono prepares you for real-world situations like parties, chai breaks, drinking, travel, and work stress.',
  },
  {
    question: 'What if I relapse?',
    answer:
      'Smono includes anti-relapse training because slips can happen. The goal is to help you understand what happened, recover quickly, and protect your smoke-free identity. Individual results vary.',
  },
  {
    question: 'Is Smono suitable for heavy smokers?',
    answer:
      'Yes. Smono is designed for different smoking patterns, including people who smoke heavily, socially, emotionally, or out of routine.',
  },
  {
    question: 'Which languages does Smono support?',
    answer:
      'Smono supports English, Hindi, Marathi, Gujarati, Spanish, French, German, Italian, and Chinese. Choose your language at signup or in Profile — onboarding, daily sessions, reflections, and support follow your choice.',
  },
  {
    question: 'Is this medical treatment?',
    answer:
      'Smono is a behavioural change and psychological support program. If you have a medical condition, use medication, are pregnant, or need clinical support, speak to a qualified healthcare professional before making major changes.',
  },
  {
    question: 'Can I gift Smono to someone I love?',
    answer:
      'Yes. Visit smono.app/gift to purchase a gift. They receive a private email invitation with your note and claim it by signing in with the email you entered. Access unlocks for them only.',
  },
  {
    question: 'Is this a subscription?',
    answer:
      'No. Smono is a one-time purchase. Pay once and keep lifetime access — no monthly renewals.',
  },
] as const

/** Gift landing FAQ — claim flow, recipient-only access. */
export const GIFT_FAQ_ITEMS = [
  {
    question: 'Who gets access when I gift Smono?',
    answer:
      'Only the recipient you named. You pay and send the invitation; they claim and unlock the 30-day program.',
  },
  {
    question: 'How does the recipient claim the gift?',
    answer:
      'They receive an email with your name, your optional note, and a claim link. They sign in with the exact email you entered, claim the gift, and can start Day 1 when ready.',
  },
  {
    question: 'Do they have to quit on Day 1?',
    answer:
      'No. Smono does not force an immediate quit. Early days can include smoking while they learn — so pressure stays low and the final cigarette becomes a goodbye, not a panic.',
  },
  {
    question: 'Will they know I paid?',
    answer:
      'They see your name and note in the invitation. Payment details stay private. The gift is framed as care, not surveillance.',
  },
  {
    question: 'What if their email is wrong?',
    answer:
      'Enter the email they will actually use to sign in. If something goes wrong, contact support@smono.app with the order details and we will help reroute the claim.',
  },
  {
    question: 'Is this medical treatment?',
    answer:
      'Smono is a behavioural change and psychological support program. If they have a medical condition, use medication, are pregnant, or need clinical support, they should speak to a qualified healthcare professional.',
  },
] as const

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Smono',
    url: SITE_URL,
    logo: `${SITE_URL}/smonologo.webp`,
    description: SEO_DESCRIPTION,
    sameAs: [
      'https://www.instagram.com/smono.app',
      'https://www.linkedin.com/company/smono-app',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@smono.app',
      contactType: 'customer support',
    },
  }
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Smono',
    url: SITE_URL,
    description: SEO_DESCRIPTION,
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Smono',
    operatingSystem: 'iOS, Android, Web',
    applicationCategory: 'HealthApplication',
    description: SEO_DESCRIPTION,
    url: APP_URL,
    offers: {
      '@type': 'Offer',
      price: '1999',
      priceCurrency: 'INR',
      description:
        'One-time payment for lifetime access to the ~30-day quit path. Price varies by country.',
    },
  }
}

/** @deprecated use softwareApplicationJsonLd */
export function mobileAppJsonLd() {
  return softwareApplicationJsonLd()
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
