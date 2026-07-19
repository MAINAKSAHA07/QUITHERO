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
import { usePageSeo } from './hooks/usePageSeo'
import { SEO_DESCRIPTION, SEO_TITLE } from './lib/seo.config'

export function LandingPage() {
  useLandingInteractions()
  usePageSeo({
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    canonicalPath: '/',
  })
  return (
    <main id="main-content">
      <Header />
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
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  )
}
