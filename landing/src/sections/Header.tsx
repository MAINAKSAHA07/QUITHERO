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
                Start your 10-day Smono transformation today.
              </span>
            </p>
            <a href="#" className="announcement-cta js-start-app">
              Start Your Smoke-Free Journey →
            </a>
          </div>
        </div>

        <nav className="nav" role="navigation" aria-label="Main navigation">
          <div className="container">
            <a href="#" className="nav-logo" aria-label="Smono home">
              <img src="/smonologo.webp?v=3" alt="Smono" className="landing-logo" />
            </a>
            <div className="nav-links">
              <a href="#reset-story">How It Works</a>
              <a href="#science">Our Method</a>
              <a href="#why-smono">Why Smono</a>
              <a href="#app-preview">Program Features</a>
              <a href="#testimonials">Success Stories</a>
              <a href="#faq">FAQ</a>
              <a href="/blog">Blog</a>
            </div>
            <div className="nav-actions">
              <button type="button" className="nav-coach">
                Talk to a Quit Coach
              </button>
              <button type="button" className="nav-cta js-start-app" aria-label="Start Now">
                <span>✦</span> Start Now
              </button>
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
          <a href="#science" role="menuitem">
            Our Method
          </a>
          <a href="#why-smono" role="menuitem">
            Why Smono
          </a>
          <a href="#app-preview" role="menuitem">
            Program Features
          </a>
          <a href="#testimonials" role="menuitem">
            Success Stories
          </a>
          <a href="#faq" role="menuitem">
            FAQ
          </a>
          <a href="/blog" role="menuitem">
            Blog
          </a>
          <button type="button" className="nav-coach mobile-menu-btn">
            Talk to a Quit Coach
          </button>
          <button type="button" className="nav-cta js-start-app mobile-menu-btn">
            Start Now
          </button>
        </div>
      </header>
    </>
  )
}
