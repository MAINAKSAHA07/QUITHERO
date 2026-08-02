import { useLandingInteractions } from './hooks/useLandingInteractions'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Problem } from './sections/Problem'
import { Journey } from './sections/Journey'
import { Languages } from './sections/Languages'
import { HowItFails } from './sections/HowItFails'
import { AppPreview } from './sections/AppPreview'
import { Showcase } from './sections/Showcase'
import { Imagine } from './sections/Imagine'
import { DesignedBy } from './sections/DesignedBy'
import { Testimonials } from './sections/Testimonials'
import { Science } from './sections/Science'
import { WhySmono } from './sections/WhySmono'
import { WhoFor } from './sections/WhoFor'
import { Comparison } from './sections/Comparison'
import { Quote } from './sections/Quote'
import { Pricing } from './sections/Pricing'
import { Faq } from './sections/Faq'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'
import { LandingCoach } from './components/LandingCoach'
import { usePageSeo } from './hooks/usePageSeo'
import { SEO_DESCRIPTION, SEO_TITLE } from './lib/seo.config'

type LandingPageProps = {
  /**
   * Buy-first: every start CTA opens checkout (homepage + /buynow).
   * Pass false only if you need free Day 1 app links again.
   */
  buyMode?: boolean
  /** Override SEO canonical (e.g. /buynow/ when reusing this page). */
  canonicalPath?: string
}

export function LandingPage({
  buyMode = true,
  canonicalPath = '/',
}: LandingPageProps = {}) {
  useLandingInteractions({ buyMode })
  usePageSeo({
    title:
      canonicalPath.includes('buynow')
        ? 'Buy Smono | 30-Day Quit Smoking Program'
        : SEO_TITLE,
    description: SEO_DESCRIPTION,
    canonicalPath,
  })
  return (
    <main id="main-content" data-buy-mode={buyMode ? '1' : undefined}>
      <Header buyMode={buyMode} />
      <Hero />
      <Problem />
      <Journey />
      <Languages />
      <HowItFails />
      <AppPreview />
      <Showcase />
      <Imagine />
      <DesignedBy />
      <Testimonials />
      <Science />
      <WhySmono />
      <WhoFor />
      <Comparison />
      <Quote />
      <Pricing buyMode={buyMode} />
      <Faq />
      <FinalCta />
      <Footer />
      <LandingCoach buyMode={buyMode} />
    </main>
  )
}
