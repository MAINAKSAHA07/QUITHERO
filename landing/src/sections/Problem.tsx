import { appStartHref } from '../lib/appUrl'
export function Problem() {
  return (
    <>
<section className="content-section" id="problem">
    <div className="container">
      <h2 className="section-title reveal">The Real Problem Is Not Cigarettes. It Is the Desire.</h2>
      <div className="content-prose reveal">
        <p>Most smokers already know smoking is harmful. You do not need another lecture, scary warning, or someone making you feel weak.</p>
        <p>The real problem is deeper. You smoke because, somewhere in your mind, cigarettes still feel useful — like stress relief, a break, company, confidence, control, or the belief that "just one" will not matter.</p>
        <p>That is exactly what Smono is designed to change. We help you question the beliefs, emotional patterns, and automatic triggers that keep smoking alive in your mind, so quitting no longer feels like losing something.</p>
        <p><strong>Because when the desire is gone, quitting becomes easier.</strong></p>
        <div className="section-cta"><a href={appStartHref()} className="btn-primary js-start-app">Remove the Desire to Smoke <span>→</span></a></div>
      </div>
    </div>
  </section>

  {/* 30-Day Journey */}
    </>
  )
}
