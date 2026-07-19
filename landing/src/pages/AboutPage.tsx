import { BlogSiteChrome } from '../components/BlogSiteChrome'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { usePageSeo } from '../hooks/usePageSeo'
import { appStartHref } from '../lib/appUrl'

export function AboutPage() {
  useLandingInteractions()
  usePageSeo({
    title: 'About Smono | Our Story, Team and Mission',
    description:
      'Meet the team behind Smono, a personalized 30-day CBT-based quit-smoking program built to help people understand triggers, reduce desire, and reclaim freedom.',
    canonicalPath: '/about/',
  })

  return (
    <BlogSiteChrome>
      <div className="about-page">
        <section className="about-hero">
          <div className="container about-hero-grid">
            <div className="about-surface about-hero-card">
              <p className="about-eyebrow">30-day quit support • CBT-based behavioural guidance</p>
              <h1 className="about-title">Why We Built Smono</h1>
              <p className="about-lead">
                Smono helps people understand and reduce the desire to smoke through
                personalized, compassionate behavioural support. The goal is not to shame
                anyone for slipping or struggling. It is to help people build clearer
                insight, steadier self-trust, and a more workable relationship with change.
              </p>
              <div className="about-quote">
                <strong>Remove the desire. Not just the cigarette.</strong>
              </div>
            </div>

            <div className="about-phoenix" aria-hidden="true">
              <div className="about-placeholder-card">
                <img
                  src="/mascot.png"
                  alt=""
                  width="260"
                  height="260"
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
              </div>
              <p className="about-small-note">
                A calm companion for the days leading up to quitting and the days after.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="container">
            <div className="about-surface">
              <h2 className="about-section-title">Our Story</h2>
              <p className="about-copy">
                Smono began as an idea in December 2025 after the founders repeatedly
                observed the same problem: people trying to quit smoking often encountered
                generic programs that did not adapt to their individual triggers, beliefs,
                habits, and behavioral patterns.
              </p>
              <p className="about-copy">
                Smono was created to close that personalization gap. Its goal is not merely
                to help users avoid cigarettes temporarily. It aims to help users understand
                and reduce the psychological desire to smoke through personalized support
                based on Cognitive Behavioral Therapy principles, mindfulness, trigger
                mapping, belief tracking, relapse-prevention psychology, and AI-personalized
                daily content.
              </p>
              <p className="about-copy">
                The founders previously worked together at <strong>The Language Network</strong>,
                where they built and shipped consumer education products. That experience
                shaped how Smono is designed: clear content, thoughtful guidance, and a
                focus on learning that fits real lives.
              </p>
              <p className="about-copy">
                They chose this approach because quitting is tied to thoughts, beliefs,
                habits, emotional patterns, and context. Personalized behavioural support
                makes it easier to understand those patterns instead of treating every quit
                attempt like the same story.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="container">
            <div className="about-surface">
              <h2 className="about-section-title">Our Mission</h2>
              <p className="about-copy">
                Help people reclaim freedom from smoking through personalized behavioral
                support, compassionate guidance, CBT-based principles, mindfulness, and
                clearer understanding of triggers and beliefs.
              </p>
              <p className="about-copy">
                Smono is a 30-day quit-smoking program: <strong>10 days</strong> focused on
                preparing to quit, followed by <strong>20 days</strong> of continued
                smoke-free support. It is available on web and mobile, with support for
                English, Hindi, Marathi, Gujarati, Spanish, French, German, Italian, and
                Chinese.
              </p>
              <p className="about-copy">
                The mission is to support users without shame, guilt, or willpower battles,
                and to treat relapse-prevention as practical support rather than moral
                judgment.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="container">
            <div className="about-surface">
              <h2 className="about-section-title">Our Approach</h2>
              <p className="about-copy">
                Quitting is personal. Two people can smoke for very different reasons:
                stress, routine, social settings, emotional patterns, or beliefs about what
                cigarettes do for them. Generic advice can feel disconnected from someone’s
                real triggers and daily life.
              </p>
              <p className="about-copy">
                CBT principles help users examine thoughts, beliefs, behaviors, and routines
                more clearly. Mindfulness can help users observe cravings without
                immediately acting on them. Trigger and belief tracking helps people notice
                patterns. Relapse-prevention support helps them respond to setbacks with
                curiosity instead of shame.
              </p>
              <p className="about-copy">
                Personalization matters across the whole journey. When users understand
                their own patterns, support becomes more relevant, practical, and easier to
                apply in real life.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="container">
            <div className="about-surface">
              <h2 className="about-section-title">Meet the Founders</h2>
              <p className="about-sub">
                Two co-founders built Smono with a shared focus on personalization, clarity,
                and compassionate support.
              </p>

              <div className="about-founders-grid">
                <article className="about-founder-card">
                  <div className="about-headshot-placeholder">
                    <span className="about-headshot-initials">PY</span>
                  </div>
                  <h3 className="about-founder-name">Pinnac Yeddy</h3>
                  <p className="about-founder-role">Co-Founder &amp; CEO</p>
                  <p className="about-copy">
                    Based in Mumbai, Maharashtra, India. Pinnac Yeddy was Co-Founder and CEO
                    of The Language Network from November 2020 to January 2026, where he
                    helped bootstrap the company to ₹2 crore ARR within six months of
                    launch. The company trained more than 5,000 students globally, built a
                    community of more than 900 foreign-language teachers, and worked with
                    learners across France, Germany, Canada, and other countries.
                  </p>
                  <p className="about-copy">
                    He also established partnerships with corporates, schools, embassies,
                    and international organizations, collaborated with the World Trade
                    Centre, Mumbai, and stepped down as CEO in January 2026. He is also
                    Co-Founder of “We have no limitations,” a venture studio, from October
                    2025 to the present. Smono emerged from the venture studio’s work.
                    Earlier, he co-founded Ukiyo Stays from June 2021 to October 2024,
                    studied at Jai Hind College, Mumbai, and has focused on business
                    strategy, brand strategy, go-to-market, growth, and customer
                    acquisition.
                  </p>
                  <p className="about-links">
                    <a
                      href="https://www.linkedin.com/in/pinnacyeddy/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  </p>
                </article>

                <article className="about-founder-card">
                  <div className="about-headshot-placeholder">
                    <span className="about-headshot-initials">MS</span>
                  </div>
                  <h3 className="about-founder-name">Mainak Saha</h3>
                  <p className="about-founder-role">Co-Founder &amp; CTO</p>
                  <p className="about-copy">
                    Mainak Malay Saha is a full-stack engineer and applied AI builder with
                    an M.S. in Artificial Intelligence from Arizona State University,
                    completed in 2026. He has focused on production LLM systems, real-time
                    infrastructure, and shipped software products.
                  </p>
                  <p className="about-copy">
                    He previously worked with Pinnac Yeddy at The Language Network and now
                    leads the technical development of Smono’s AI-personalization layer,
                    which adapts CBT-based content to each user.
                  </p>
                  <p className="about-links">
                    <a href="https://mainaksaha.in/" target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                    <a
                      href="https://www.linkedin.com/in/mainaksaha08"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="container">
            <div className="about-surface">
              <h2 className="about-section-title">Trust &amp; Policies</h2>
              <p className="about-copy">
                Quit-smoking content should be transparent about sources, limits, and medical
                boundaries. Read our{' '}
                <a href="/editorial-policy/">Editorial Policy</a> and{' '}
                <a href="/medical-disclaimer/">Medical Disclaimer</a>.
              </p>
              <p className="about-copy">
                Read the privacy policy here: <a href="/privacy/">Privacy Policy</a>
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="container">
            <div className="about-surface">
              <h2 className="about-section-title">Our Values</h2>
              <div className="about-values-grid">
                <article className="about-value-card">
                  <h3>Compassion Over Shame</h3>
                  <p>People deserve support, not judgment.</p>
                </article>
                <article className="about-value-card">
                  <h3>Personalization</h3>
                  <p>Every person has different triggers, beliefs, routines, and motivations.</p>
                </article>
                <article className="about-value-card">
                  <h3>Honesty</h3>
                  <p>Smono should communicate clearly about what the program does and does not provide.</p>
                </article>
                <article className="about-value-card">
                  <h3>Privacy and Respect</h3>
                  <p>Sensitive personal information must be handled carefully and respectfully.</p>
                </article>
                <article className="about-value-card">
                  <h3>Freedom-Focused Progress</h3>
                  <p>
                    The goal is to help users build a life in which smoking feels less
                    necessary and freedom feels more achievable.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section about-section--last">
          <div className="container">
            <div className="about-cta-band">
              <h2 className="about-section-title">Reclaim your freedom. One reset at a time.</h2>
              <p className="about-copy">
                Start your journey with personalized, compassionate behavioral support.
              </p>
              <div className="about-cta-actions">
                <a className="blog-site-cta js-start-app" href={appStartHref()}>
                  <span aria-hidden="true">✦</span> Start Your Journey
                </a>
                <a className="about-secondary-btn" href="/blog/">
                  Read the Blog
                </a>
                <a className="about-secondary-btn" href="/privacy/">
                  Privacy Policy
                </a>
                <a className="about-secondary-btn" href="mailto:support@smono.app">
                  support@smono.app
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BlogSiteChrome>
  )
}
