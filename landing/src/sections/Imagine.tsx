import { appStartHref } from '../lib/appUrl'
export function Imagine() {
  return (
    <>
<section className="content-section" style={{paddingTop: '60px'}}>
    <div className="container">
      <h2 className="section-title reveal">Imagine This Version of You</h2>
      <div className="content-prose reveal">
        <p>You wake up and do not reach for a cigarette. You finish a meal and do not feel incomplete. You handle stress without stepping outside. You meet smoker friends without feeling pulled.</p>
        <p>You breathe better. You smell better. You feel cleaner. You feel proud — not because you fought smoking every day, but because smoking no longer feels like something you want.</p>
        <p><strong>That is the Smono goal.</strong></p>
        <div className="section-cta"><a href={appStartHref()} className="btn-primary js-start-app">I Want This Life <span>→</span></a></div>
      </div>
    </div>
  </section>

  {/* Designed With Respect */}
    </>
  )
}
