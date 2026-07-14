export function Hero() {
  return (
    <>
<section className="hero">
    <div className="hero-bg">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
    </div>
    <div className="container hero-content">
      <div className="hero-text">
        <span className="hero-pill">🌿 10-Day Quit · 20-Day Support</span>
        <h1 className="hero-headline">Quit Smoking in 10 Days Without Feeling Like You&apos;re Giving Up Your Life</h1>
        <p className="hero-sub">Remove the desire to smoke — not just the cigarette. A guided psychological program that fits real life, without guilt, patches, or willpower wars.</p>
        <p className="hero-about" id="about-smono">
          <strong>What is Smono?</strong> Smono is a quit smoking app that uses cognitive behavioural therapy (CBT), mindfulness, and relapse prevention to help you stop smoking without willpower battles. The program is a {`10-day quit path with 20 days of smoke-free support`} (30 days total), available on web and mobile.
        </p>
        <div className="hero-ctas">
          <button className="btn-primary js-start-app">Start My 10-Day Quit Program <span>→</span></button>
          <button className="btn-ghost">▷ See How Smono Works</button>
        </div>
        <p className="hero-micro">You can continue smoking during the early part of the program. Smono guides you step by step until your final cigarette.</p>
        <ul className="hero-bullets">
          <li>No daily craving battles</li>
          <li>No gums, vapes, or patches</li>
          <li>No guilt or lifestyle overhaul</li>
        </ul>
        <div className="trust-strip">
          <span className="trust-chip">10-Day Quit</span>
          <span className="trust-chip">20-Day Support</span>
          <span className="trust-chip">CBT-Based</span>
          <span className="trust-chip">Trigger Mapping</span>
          <span className="trust-chip">Relapse Prevention</span>
        </div>
        <div className="hero-avatar-row">
          <div className="avatar-stack">
            <div className="av">AK</div><div className="av">SR</div><div className="av">MJ</div><div className="av">+</div>
          </div>
          <p>Join others building a <strong>smoke-free life</strong>.</p>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-visual-frame">
          <div className="reset-node-container">
            <canvas id="heroCanvas"></canvas>
            <div className="node-center-label">
              <span className="day-eyebrow">Your Journey</span>
              <span className="day-num">Day 8</span>
              <span className="day-total">/ 10</span>
              <span className="day-sub">Preparing for your<br />final cigarette.</span>
            </div>
            <div className="micro-label label-trigger" style={{top: '4%', left: '2%'}}>Trigger</div>
            <div className="micro-label label-belief" style={{bottom: '18%', left: '-2%'}}>Belief</div>
            <div className="micro-label label-craving" style={{top: '8%', right: '0%'}}>Craving</div>
            <div className="micro-label label-reset" style={{bottom: '4%', right: '2%'}}>Reset</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Section 1: The Real Problem */}
    </>
  )
}
