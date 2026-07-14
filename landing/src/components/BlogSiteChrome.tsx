import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  children: ReactNode
}

export function BlogSiteChrome({ children }: Props) {
  return (
    <>
      <header className="blog-site-header">
        <div className="container blog-site-header-inner">
          <Link to="/" className="nav-logo" aria-label="Smono home">
            <img src="/smonologo.webp?v=3" alt="Smono" className="landing-logo" />
          </Link>
          <nav className="blog-site-nav" aria-label="Blog navigation">
            <Link to="/">Home</Link>
            <Link to="/blog">Blog</Link>
          </nav>
          <button type="button" className="nav-cta js-start-app" aria-label="Start Now">
            <span>✦</span> Start Now
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="blog-site-footer">
        <div className="container">
          <p>
            <Link to="/">← Back to Smono</Link>
          </p>
          <p className="blog-site-footer-copy">© {new Date().getFullYear()} Smono</p>
        </div>
      </footer>
    </>
  )
}
