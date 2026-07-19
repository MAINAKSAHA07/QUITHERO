import { appStartHref } from '../lib/appUrl'
export function Comparison() {
  return (
    <>
<section className="how" id="comparison">
    <div className="container">
      <h2 className="section-title reveal">Smono vs Traditional Quit Methods</h2>
      <div className="compare-grid reveal">
        <div className="compare-card">
          <h4>Cold Turkey</h4>
          <p>Relies heavily on willpower. Often creates panic, pressure, and constant resistance.</p>
        </div>
        <div className="compare-card">
          <h4>Cutting Down</h4>
          <p>Keeps the cigarette valuable in your mind. Can make every cigarette feel more precious.</p>
        </div>
        <div className="compare-card">
          <h4>Nicotine Substitutes</h4>
          <p>May reduce smoking, but can keep nicotine dependence alive in a new form.</p>
        </div>
        <div className="compare-card highlight">
          <h4>Smono</h4>
          <p>Works on the psychology behind smoking. Removes the desire — and guides you through quitting and staying smoke-free.</p>
        </div>
      </div>
      <div className="section-cta reveal" style={{textAlign: 'center', marginTop: '40px'}}>
        <a href={appStartHref()} className="btn-primary js-start-app">Choose the Smarter Way to Quit <span>→</span></a>
      </div>
    </div>
  </section>

  {/* Quote */}
    </>
  )
}
