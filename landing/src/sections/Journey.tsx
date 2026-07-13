export function Journey() {
  return (
    <>
<section className="reset-story" id="reset-story">
    <div className="container" style={{marginBottom: '48px', textAlign: 'center'}}>
      <h2 className="section-title reveal">The 30-Day Smono Journey</h2>
      <p className="section-sub reveal">10 days to quit. 20 days to stay free. A complete transformation path — not just a quit day.</p>
    </div>
    <div className="container story-grid">
      {/* Sticky Visual (Left Side on Desktop) */}
      <div className="story-sticky-visual">
        <div className="story-canvas-box">
          <canvas id="storyCanvas" aria-hidden="true" />
          <div className="story-canvas-fallback" id="storyCanvasLabel">
            Phase 1 · Understand
          </div>
        </div>
      </div>

      {/* Scrollable Text Blocks (Right Side on Desktop) */}
      <div className="story-scroll-content">
        <div className="story-timeline-line">
          <div className="story-timeline-progress" id="timelineProgress"></div>
        </div>

        <div className="story-step active" data-step="1">
          <div className="step-dot"></div>
          <span className="step-badge">Phase 1 · Days 1–3</span>
          <h3>Understand the Trap</h3>
          <p>Learn why smoking feels so hard to quit — cravings, relief, stress, boredom, pleasure, and habit. See why most people relapse after "just one" cigarette.</p>
        </div>

        <div className="story-step" data-step="2">
          <div className="step-dot"></div>
          <span className="step-badge">Phase 2 · Days 4–6</span>
          <h3>Break the Illusion</h3>
          <p>Question the biggest smoking beliefs: stress relief, concentration, social ease, and pleasure — or just relief from discomfort nicotine created?</p>
        </div>

        <div className="story-step" data-step="3">
          <div className="step-dot"></div>
          <span className="step-badge">Phase 3 · Days 7–10</span>
          <h3>Prepare for Your Final Cigarette</h3>
          <p>Identify personal triggers, build your smoke-free identity, and complete mindset shifts before quitting. Your final cigarette becomes a goodbye, not a sacrifice.</p>
        </div>

        <div className="story-step" data-step="4">
          <div className="step-dot"></div>
          <span className="step-badge">Phase 4 · Days 11–30</span>
          <h3>Stay Free for Life</h3>
          <p>Daily reinforcement, mindfulness tools, craving response training, relapse prevention, and "just one cigarette" protection — until freedom feels natural.</p>
        </div>
      </div>
    </div>
    <div className="section-cta reveal" style={{textAlign: 'center', marginTop: '28px'}}>
      <button className="btn-primary js-start-app">Begin Day 1 <span>→</span></button>
    </div>
  </section>
    </>
  )
}
