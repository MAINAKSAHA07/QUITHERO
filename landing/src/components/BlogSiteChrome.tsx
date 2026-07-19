import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { appStartHref } from '../lib/appUrl'

type Props = {
  children: ReactNode
}

export function BlogSiteChrome({ children }: Props) {
  const { pathname } = useLocation()
  const onBlog = pathname === '/blog' || pathname.startsWith('/blog/')

  return (
    <div className="blog-site">
      <header className="blog-site-header">
        <div className="container blog-site-header-inner">
          <a href="/" className="blog-site-logo" aria-label="Smono home">
            <img src="/smonologo.webp?v=3" alt="Smono" className="blog-site-logo-img" />
          </a>
          <nav className="blog-site-nav" aria-label="Site navigation">
            <a href="/how-it-works/">How It Works</a>
            <a href="/blog/" aria-current={onBlog ? 'page' : undefined}>
              Blog
            </a>
            <a href="/about/">About</a>
          </nav>
          <a href={appStartHref()} className="blog-site-cta js-start-app" aria-label="Start Now">
            Start Now
          </a>
        </div>
      </header>
      <main className="blog-site-main">{children}</main>
      <footer className="blog-site-footer">
        <div className="container blog-site-footer-inner">
          <a href="/" className="blog-site-logo" aria-label="Smono home">
            <img src="/smonologo.webp?v=3" alt="Smono" className="blog-site-logo-img" />
          </a>
          <nav className="blog-site-footer-nav" aria-label="Footer">
            <a href="/how-it-works/">How It Works</a>
            <a href="/method/">Method</a>
            <a href="/quit-smoking-program/">Program</a>
            <a href="/languages/">Languages</a>
            <a href="/pricing/">Pricing</a>
            <a href="/about/">About</a>
            <a href="/blog/">Blog</a>
            <a href="/privacy/">Privacy</a>
            <a href="/terms/">Terms</a>
            <a href="/editorial-policy/">Editorial</a>
            <a href="/medical-disclaimer/">Disclaimer</a>
          </nav>
          <p className="blog-site-footer-copy">© {new Date().getFullYear()} Smono</p>
        </div>
      </footer>
    </div>
  )
}
