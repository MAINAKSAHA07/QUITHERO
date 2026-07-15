/** Shared SEO copy — keep in sync with visible on-page content. */
export const SITE_URL = 'https://smono.app'
export const APP_URL = 'https://app.smono.app'

export const SEO_TITLE =
  'Smono — Quit Smoking in 10 Days Without Willpower'

export const SEO_DESCRIPTION =
  'Smono is a personalised quit-smoking app: remove the desire to smoke in 10 days, with 20 days of smoke-free support. CBT, mindfulness, and relapse prevention — no patches or willpower wars.'

export const PROGRAM_FRAMING =
  '10-day quit program with 20 days of smoke-free support (30 days total)'

export const FAQ_ITEMS = [
  {
    question: 'Do I have to stop smoking immediately?',
    answer:
      'No. Smono does not force you to quit on Day 1. In the early part of the program, you can continue smoking while completing the lessons and exercises. This helps reduce pressure and prepares your mind for the final cigarette.',
  },
  {
    question: 'How long does the program take?',
    answer:
      'Smono includes a 10-day quit program followed by 20 days of smoke-free support, mindfulness, and relapse prevention.',
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
      'Smono includes anti-relapse training because slips can happen. The goal is to help you understand what happened, recover quickly, and protect your smoke-free identity.',
  },
  {
    question: 'Is Smono suitable for heavy smokers?',
    answer:
      'Yes. Smono is designed for different smoking patterns, including people who smoke heavily, socially, emotionally, or out of routine.',
  },
  {
    question: 'Is this medical treatment?',
    answer:
      'Smono is a behavioural change and psychological support program. If you have a medical condition, use medication, are pregnant, or need clinical support, speak to a qualified healthcare professional before making major changes.',
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

export function mobileAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Smono',
    operatingSystem: 'iOS, Android, Web',
    applicationCategory: 'HealthApplication',
    description: SEO_DESCRIPTION,
    url: APP_URL,
    offers: {
      '@type': 'Offer',
      price: '1999',
      priceCurrency: 'INR',
      description: 'Monthly program access; price varies by country in the app.',
    },
  }
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
