export function FinalCta() {
  return (
    <>
<section className="final-cta">
    <canvas id="finalCtaCanvas"></canvas>
    <div className="container" style={{position: 'relative', zIndex: '2'}}>
      <h2 className="reveal">Become Smoke-Free With Smono</h2>
      <p className="reveal" style={{maxWidth: '640px', margin: '0 auto 16px', lineHeight: '1.7'}}>You do not need another failed attempt. You need a method that helps your mind stop wanting cigarettes.</p>
      <p className="reveal" style={{maxWidth: '640px', margin: '0 auto 40px', lineHeight: '1.7', color: 'var(--muted)'}}>A clear 30-day path: 10 days to quit. 20 days to stay free. A lifetime to enjoy the result.</p>
      <button className="pulse-btn reveal js-start-app">Start Smono Now</button>
      <button className="btn-ghost reveal" style={{display: 'inline-flex', marginTop: '16px', marginLeft: '12px'}}>Talk to a Quit Coach</button>
      <p className="final-sub reveal">Complete the full program for the best results.</p>
    </div>
  </section>

  {/* Footer */}
    </>
  )
}
