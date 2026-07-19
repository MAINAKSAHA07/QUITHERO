import { type ComponentType } from 'react'
import { MarketingPage } from '../components/MarketingPage'
import { Journey } from '../sections/Journey'
import { HowItFails } from '../sections/HowItFails'
import { AppPreview } from '../sections/AppPreview'
import { Showcase } from '../sections/Showcase'
import { Imagine } from '../sections/Imagine'
import { Science } from '../sections/Science'
import { DesignedBy } from '../sections/DesignedBy'
import { WhySmono } from '../sections/WhySmono'
import { Quote } from '../sections/Quote'
import { Problem } from '../sections/Problem'
import { WhoFor } from '../sections/WhoFor'
import { Comparison } from '../sections/Comparison'
import { Languages } from '../sections/Languages'
import { Pricing } from '../sections/Pricing'
import { FinalCta } from '../sections/FinalCta'

export type MarketingRoute = {
  slug: string
  path: string
  title: string
  description: string
  Component: ComponentType
}

export function HowItWorksPage() {
  return (
    <MarketingPage
      title="How Smono Works | 10-Day Quit + 20-Day Support"
      description="See how Smono guides you through a 10-day quit path and 20 days of smoke-free support with CBT, trigger mapping, and relapse prevention."
      canonicalPath="/how-it-works/"
      eyebrow="Step-by-step program"
      h1="How Smono Works"
      lead="From your first lesson to your quit day and beyond — a guided path built for real life, not willpower battles."
    >
      <Journey />
      <HowItFails />
      <AppPreview />
      <Showcase />
      <Imagine />
      <FinalCta />
    </MarketingPage>
  )
}

export function MethodPage() {
  return (
    <MarketingPage
      title="The Smono Method | CBT-Based Quit Smoking Approach"
      description="Learn how Smono combines CBT, mindfulness, habit psychology, and behavioural reframing to help reduce the desire to smoke."
      canonicalPath="/method/"
      eyebrow="Behavioural science"
      h1="The Smono Method"
      lead="CBT, mindfulness, and relapse-prevention psychology — applied to the beliefs and triggers that keep smoking alive."
    >
      <Science />
      <DesignedBy />
      <WhySmono />
      <Quote />
      <FinalCta />
    </MarketingPage>
  )
}

export function QuitSmokingProgramPage() {
  return (
    <MarketingPage
      title="30-Day Quit Smoking Program | Smono"
      description="Smono is a personalized 30-day quit-smoking program: 10 days preparing to quit, 20 days of smoke-free support. CBT-based, app-guided, no nicotine substitutes."
      canonicalPath="/quit-smoking-program/"
      eyebrow="30-day path"
      h1="The Smono Quit Smoking Program"
      lead="A structured program to understand the desire to smoke — not just fight cravings day after day."
    >
      <Problem />
      <WhoFor />
      <Comparison />
      <FinalCta />
    </MarketingPage>
  )
}

export function LanguagesPage() {
  return (
    <MarketingPage
      title="Quit Smoking in 9 Languages | Smono"
      description="Smono supports English, Hindi, Marathi, Gujarati, Spanish, French, German, Italian, and Chinese — onboarding, sessions, and support in your language."
      canonicalPath="/languages/"
      eyebrow="9 languages"
      h1="Your Quit Journey in Your Language"
      lead="Choose your language once. Onboarding, daily sessions, reflections, and support follow you."
    >
      <Languages />
      <FinalCta />
    </MarketingPage>
  )
}

export function PricingPage() {
  return (
    <MarketingPage
      title="Smono Pricing | Quit Smoking Program"
      description="Smono Complete Program pricing: a 10-day quit path with 20 days of support. Daily CBT lessons, trigger mapping, craving support, and relapse prevention."
      canonicalPath="/pricing/"
      eyebrow="Simple pricing"
      h1="What You Get Inside Smono"
      lead="Billed monthly, but the full program is 30 days — most people only need one month. Sessions take 20 to 40 minutes a day."
    >
      <Pricing />
      <FinalCta />
    </MarketingPage>
  )
}

export function EditorialPolicyPage() {
  return (
    <MarketingPage
      title="Editorial Policy | Smono"
      description="How Smono creates and reviews program content, educational articles, and health-related guidance for accuracy, compassion, and transparency."
      canonicalPath="/editorial-policy/"
      h1="Editorial and Content Process"
      lead="How we create, review, and present quit-smoking content."
    >
      <section className="about-section about-section--last">
        <div className="container">
          <div className="about-surface">
            <p className="about-copy">
              Smono&apos;s program content is informed by established, published principles of
              Cognitive Behavioral Therapy, mindfulness, and relapse-prevention psychology. Content
              is created and reviewed by the Smono team for clarity, accuracy, tone, compassion,
              and consistency with the program.
            </p>
            <p className="about-copy">
              Smono does not currently claim clinical review unless verified clinician information
              is later provided.
            </p>
            <p className="about-copy">
              Health articles and educational content cite established, authoritative sources
              clearly and directly to support trust and transparency.
            </p>
            <p className="about-copy">
              See also: <a href="/medical-disclaimer/">Medical Disclaimer</a> ·{' '}
              <a href="/about/">About Smono</a>
            </p>
          </div>
        </div>
      </section>
    </MarketingPage>
  )
}

export function MedicalDisclaimerPage() {
  return (
    <MarketingPage
      title="Medical Disclaimer | Smono"
      description="Smono is a behavioural-change and psychological-support program. It is not medical treatment and does not replace advice from a qualified healthcare professional."
      canonicalPath="/medical-disclaimer/"
      h1="Medical Disclaimer"
      lead="Important information about what Smono is — and is not."
    >
      <section className="about-section about-section--last">
        <div className="container">
          <div className="about-surface">
            <p className="about-copy">
              Smono is a behavioral-change and psychological-support program. Smono is not
              medical treatment. Smono does not diagnose, treat, cure, or prevent a medical
              condition, and it does not replace advice from a qualified healthcare professional.
            </p>
            <p className="about-copy">
              Users with medical conditions, users taking medication, pregnant users, or users
              needing clinical support should consult an appropriate healthcare professional. Users
              experiencing urgent or severe symptoms should contact local emergency or professional
              medical services.
            </p>
            <p className="about-copy">
              Individual results vary. See our <a href="/terms/">Terms of Service</a> for full
              program terms.
            </p>
          </div>
        </div>
      </section>
    </MarketingPage>
  )
}

export const MARKETING_ROUTES: MarketingRoute[] = [
  {
    slug: 'how-it-works',
    path: '/how-it-works',
    title: 'How Smono Works | 10-Day Quit + 20-Day Support',
    description:
      'See how Smono guides you through a 10-day quit path and 20 days of smoke-free support with CBT, trigger mapping, and relapse prevention.',
    Component: HowItWorksPage,
  },
  {
    slug: 'method',
    path: '/method',
    title: 'The Smono Method | CBT-Based Quit Smoking Approach',
    description:
      'Learn how Smono combines CBT, mindfulness, habit psychology, and behavioural reframing to help reduce the desire to smoke.',
    Component: MethodPage,
  },
  {
    slug: 'quit-smoking-program',
    path: '/quit-smoking-program',
    title: '30-Day Quit Smoking Program | Smono',
    description:
      'Smono is a personalized 30-day quit-smoking program: 10 days preparing to quit, 20 days of smoke-free support. CBT-based, app-guided, no nicotine substitutes.',
    Component: QuitSmokingProgramPage,
  },
  {
    slug: 'languages',
    path: '/languages',
    title: 'Quit Smoking in 9 Languages | Smono',
    description:
      'Smono supports English, Hindi, Marathi, Gujarati, Spanish, French, German, Italian, and Chinese — onboarding, sessions, and support in your language.',
    Component: LanguagesPage,
  },
  {
    slug: 'pricing',
    path: '/pricing',
    title: 'Smono Pricing | Quit Smoking Program',
    description:
      'Smono Complete Program pricing: a 10-day quit path with 20 days of support. Daily CBT lessons, trigger mapping, craving support, and relapse prevention.',
    Component: PricingPage,
  },
  {
    slug: 'editorial-policy',
    path: '/editorial-policy',
    title: 'Editorial Policy | Smono',
    description:
      'How Smono creates and reviews program content, educational articles, and health-related guidance for accuracy, compassion, and transparency.',
    Component: EditorialPolicyPage,
  },
  {
    slug: 'medical-disclaimer',
    path: '/medical-disclaimer',
    title: 'Medical Disclaimer | Smono',
    description:
      'Smono is a behavioural-change and psychological-support program. It is not medical treatment and does not replace advice from a qualified healthcare professional.',
    Component: MedicalDisclaimerPage,
  },
]
