import { appStartHref } from '../lib/appUrl'
export function Quote() {
  return (
    <>
<section className="quote-section">
    <div className="container reveal">
      <blockquote>"The only impossible journey is the one you never begin."</blockquote>
      <cite>— Tony Robbins</cite>
      <p style={{maxWidth: '560px', margin: '24px auto 32px', color: 'var(--muted)', lineHeight: '1.7'}}>Your smoke-free life begins with one decision — not to suffer, but to understand smoking, remove its power, and become free.</p>
      <a href={appStartHref()} className="btn-primary js-start-app">Begin My Journey <span>→</span></a>
    </div>
  </section>

  {/* Pricing */}
    </>
  )
}
