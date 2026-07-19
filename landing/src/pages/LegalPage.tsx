import { Link } from 'react-router-dom'
import { BlogSiteChrome } from '../components/BlogSiteChrome'
import { useLandingInteractions } from '../hooks/useLandingInteractions'
import { usePageSeo } from '../hooks/usePageSeo'

type Kind = 'privacy' | 'terms'

const UPDATED = 'July 2026'

export function LegalPage({ kind }: { kind: Kind }) {
  useLandingInteractions()
  const isPrivacy = kind === 'privacy'
  usePageSeo({
    title: isPrivacy ? 'Privacy Policy — Smono' : 'Terms of Service — Smono',
    description: isPrivacy
      ? 'How Smono collects, uses, and deletes personal data for the quit-smoking program.'
      : 'Terms of use for Smono, including the health disclaimer for this behavioural quit-smoking program.',
    canonicalPath: isPrivacy ? '/privacy/' : '/terms/',
  })

  return (
    <BlogSiteChrome>
      <section className="legal-page">
        <div className="container legal-page-inner">
          <Link to="/" className="blog-back">
            ← Back to Smono
          </Link>
          <p className="blog-eyebrow">{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</p>
          <h1 className="blog-title">{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
          <p className="blog-lead">Last updated: {UPDATED}</p>

          {isPrivacy ? (
            <div className="legal-prose">
              <h2>1. Data We Collect</h2>
              <ul>
                <li>
                  <strong>Profile details:</strong> email address, language, and onboarding settings.
                </li>
                <li>
                  <strong>Onboarding responses:</strong> habits (pack cost, daily count), quit readiness,
                  support preferences, and related self-report answers.
                </li>
                <li>
                  <strong>Activity logs:</strong> cravings, mapped triggers, breathing exercises, and
                  daily program progress.
                </li>
                <li>
                  <strong>Journals:</strong> reflection text you write during open-question modules.
                </li>
              </ul>

              <h2>2. How We Use Your Data</h2>
              <p>
                Smono uses your inputs to personalize your quit plan, show progress, send optional
                reminders you enable, and operate support chat. We do not sell your personal data.
              </p>

              <h2>3. Security &amp; Hosting</h2>
              <p>
                Communications between the app and our servers use TLS. Access controls limit who can
                view user-associated records. Support messages are encrypted at rest.
              </p>

              <h2>4. Data Deletion</h2>
              <p>
                You can request permanent deletion of your account and associated data from Profile →
                Request account deletion. Our team reviews and processes requests; deletion is not
                always instantaneous.
              </p>

              <h2>5. Contact</h2>
              <p>
                Questions about privacy: <a href="mailto:support@smono.app">support@smono.app</a>
              </p>
            </div>
          ) : (
            <div className="legal-prose">
              <h2>1. Health Disclaimer</h2>
              <p>
                Smono provides educational, self-guided cognitive behavioural therapy (CBT) modules,
                trigger mapping, and breathing tools to help you change smoking habits.{' '}
                <strong>Smono is not a licensed medical care provider</strong>, medical device,
                diagnosis system, or clinical therapy program. Do not ignore professional medical
                advice or delay care because of insights from this app.
              </p>

              <h2>2. Accounts</h2>
              <p>
                You are responsible for protecting your login credentials. You agree to provide true
                and accurate information during language selection, onboarding, and profile setup.
              </p>

              <h2>3. Acceptable Use</h2>
              <p>
                Use journals, trackers, and support features in good faith. Uploading malware,
                harassing others, or attempting to bypass security controls is prohibited.
              </p>

              <h2>4. Subscriptions &amp; Billing</h2>
              <p>
                Paid access is billed according to the plan shown at checkout. Refunds follow the
                rules of the payment provider. Completing the full 30-day path (10-day quit + 20-day
                support) gives the best chance of lasting change; results vary by person.
              </p>

              <h2>5. Contact</h2>
              <p>
                Questions about these terms: <a href="mailto:support@smono.app">support@smono.app</a>
              </p>
            </div>
          )}
        </div>
      </section>
    </BlogSiteChrome>
  )
}
