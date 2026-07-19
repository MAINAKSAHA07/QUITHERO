import { appStartHref } from '../lib/appUrl'

const startHref = appStartHref()

export function Header() {
  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />

      <header className="site-header">
        <div className="announcement-bar">
          <div className="announcement-inner">
            <p className="announcement-copy">
              <strong>Quit smoking without fighting cravings every day.</strong>
              <span className="announcement-secondary">
                {' '}
                10-day quit · 9 languages · CBT-based.
              </span>
            </p>
            <a href={startHref} className="announcement-cta js-start-app">
              Start free →
            </a>
          </div>
        </div>

        <nav className="nav" role="navigation" aria-label="Main navigation">
          <div className="container">
            <a href="/" className="nav-logo" aria-label="Smono home">
              <img src="/smonologo.webp?v=3" alt="Smono" className="landing-logo" />
            </a>
            <div className="nav-links">
              <a href="#reset-story">How It Works</a>
              <a href="#languages">Languages</a>
              <a href="#why-smono">Why Smono</a>
              <a href="#faq">FAQ</a>
              <a href="/blog/">Blog</a>
            </div>
            <div className="nav-actions">
              <a href="mailto:support@smono.app" className="nav-coach">
                Talk to a Quit Coach
              </a>
              <a href={startHref} className="nav-cta js-start-app" aria-label="Start Now">
                <span>✦</span> Start Now
              </a>
            </div>
            <button
              type="button"
              className="nav-hamburger"
              aria-label="Toggle menu"
              aria-expanded="false"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>

        <div className="mobile-menu" role="menu">
          <a href="#reset-story" role="menuitem">
            How It Works
          </a>
          <a href="#languages" role="menuitem">
            Languages
          </a>
          <a href="#why-smono" role="menuitem">
            Why Smono
          </a>
          <a href="#faq" role="menuitem">
            FAQ
          </a>
          <a href="/blog/" role="menuitem">
            Blog
          </a>
          <a href="mailto:support@smono.app" className="nav-coach mobile-menu-btn" role="menuitem">
            Talk to a Quit Coach
          </a>
          <a href={startHref} className="nav-cta js-start-app mobile-menu-btn" role="menuitem">
            Start Now
          </a>
        </div>
      </header>
    </>
  )
}
