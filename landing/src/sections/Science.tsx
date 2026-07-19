import { appStartHref } from '../lib/appUrl'
export function Science() {
  return (
    <>
<section className="science" id="science">
    <div className="container">
      <h2 className="section-title reveal">The Smono Method</h2>
      <p className="section-sub reveal">Behavioural science meets real-life smoking psychology — CBT, habit psychology, mindfulness, and behavioural reframing in one guided program.</p>
      <div className="science-content">

        {/* Left: CBT diagram + belief bars */}
        <div className="science-visual reveal">
          <div className="cbt-loop-box">
            <svg className="cbt-loop-svg" viewBox="0 0 300 210" aria-hidden="true">
              <defs>
                <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="rgba(74,144,178,0.08)" />
                </pattern>
                <filter id="nodeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#dotGrid)" rx="12"/>

              {/* Lines */}
              <path className="loop-line loop-primary" d="M 60,110 L 150,55" />
              <path className="loop-line loop-bad" d="M 150,55 L 240,110" />
              <path className="loop-line loop-good" d="M 150,55 L 150,155" />

              {/* Interrupt badge at midpoint of bad path (195, 83) — light-mode glass style */}
              <circle cx="195" cy="83" r="11" fill="rgba(255,255,255,0.85)" stroke="#e63946" strokeWidth="1.5"/>
              <line x1="189" y1="77" x2="201" y2="89" stroke="#e63946" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="201" y1="77" x2="189" y2="89" stroke="#e63946" strokeWidth="2.5" strokeLinecap="round"/>

              {/* Trigger node */}
              <g className="loop-node" transform="translate(60, 110)">
                <circle r="18" className="node-bg" />
                <circle r="8" fill="var(--primary)" />
                <text y="34" className="node-label">Trigger</text>
              </g>
              {/* CBT Intervention node (brand primary blue, not warm orange) */}
              <g className="loop-node" transform="translate(150, 55)">
                <circle r="22" className="node-bg active-pulse" />
                <circle r="10" fill="var(--primary)" />
                <text y="-30" className="node-label">CBT Intervention</text>
              </g>
              {/* Smoking Loop node (dimmed, warm red) */}
              <g className="loop-node" transform="translate(240, 110)" opacity="0.40">
                <circle r="18" className="node-bg" />
                <circle r="8" fill="#e63946" />
                <text y="34" className="node-label">Smoking Loop</text>
              </g>
              {/* Healthy Reset node */}
              <g className="loop-node" transform="translate(150, 155)">
                <circle r="18" className="node-bg rewired" />
                <circle r="8" fill="var(--secondary)" />
                <text y="34" className="node-label">Healthy Reset</text>
              </g>

              {/* Travelling pulse dot (brand primary color) */}
              <circle r="4" fill="var(--primary)" opacity="0.85">
                <animateMotion dur="3.5s" repeatCount="indefinite" path="M 60,110 L 150,55 L 150,155"/>
              </circle>
            </svg>
          </div>

          {/* Belief strength bars */}
          <div className="belief-panel" id="beliefBars">
            <div className="belief-panel-header">
              <span className="belief-panel-title">Belief Strength</span>
              <div className="belief-phase-pills">
                <span className="phase-pill before">Day 0</span>
                <span className="phase-pill after">Day 30</span>
              </div>
            </div>

            <div className="belief-bar-item">
              <div className="belief-bar-row">
                <span className="belief-bar-label">"Smoking relaxes me"</span>
                <span className="belief-bar-pct">85%</span>
              </div>
              <div className="belief-bar-track"><div className="belief-bar-fill" data-before="85" data-after="25"></div></div>
            </div>
            <div className="belief-bar-item">
              <div className="belief-bar-row">
                <span className="belief-bar-label">"I enjoy smoking"</span>
                <span className="belief-bar-pct">75%</span>
              </div>
              <div className="belief-bar-track"><div className="belief-bar-fill" data-before="75" data-after="15"></div></div>
            </div>
            <div className="belief-bar-item">
              <div className="belief-bar-row">
                <span className="belief-bar-label">"Helps me concentrate"</span>
                <span className="belief-bar-pct">65%</span>
              </div>
              <div className="belief-bar-track"><div className="belief-bar-fill" data-before="65" data-after="20"></div></div>
            </div>
            <div className="belief-bar-item">
              <div className="belief-bar-row">
                <span className="belief-bar-label">"I need it socially"</span>
                <span className="belief-bar-pct">70%</span>
              </div>
              <div className="belief-bar-track"><div className="belief-bar-fill" data-before="70" data-after="10"></div></div>
            </div>
            <div className="belief-bar-item" style={{marginBottom: '0'}}>
              <div className="belief-bar-row">
                <span className="belief-bar-label">"Handles my stress"</span>
                <span className="belief-bar-pct">90%</span>
              </div>
              <div className="belief-bar-track"><div className="belief-bar-fill" data-before="90" data-after="30"></div></div>
            </div>

            <div className="belief-bar-legend">
              <span className="legend-dot before">Before CBT</span>
              <span className="legend-dot after">After 30 days</span>
            </div>
          </div>
        </div>

        {/* Right: science explanation cards */}
        <div className="science-cards reveal">
          <div className="science-card">
            <div className="science-card-icon">🧠</div>
            <div className="science-card-body">
              <h4>1. Cognitive Reframing</h4>
              <p>Challenge thoughts that make smoking feel necessary — "I need a cigarette to relax," "I cannot enjoy drinking without smoking," "Quitting will be miserable."</p>
            </div>
          </div>
          <div className="science-card">
            <div className="science-card-icon">🗺️</div>
            <div className="science-card-body">
              <h4>2. Trigger Mapping</h4>
              <p>Identify personal smoking loops: morning tea, work stress, after meals, driving, alcohol, boredom, phone calls, and social situations.</p>
            </div>
          </div>
          <div className="science-card">
            <div className="science-card-icon">🔄</div>
            <div className="science-card-body">
              <h4>3. Habit Loop Breaking</h4>
              <p>Interrupt the trigger → thought → craving → action → relief cycle without force, fear, or constant self-control.</p>
            </div>
          </div>
          <div className="science-card">
            <div className="science-card-icon">💫</div>
            <div className="science-card-body">
              <h4>4. Desire Removal</h4>
              <p>Most methods focus on stopping the action. Smono focuses on removing the want — so you're not constantly resisting cigarettes.</p>
            </div>
          </div>
          <div className="science-card">
            <div className="science-card-icon">🌬️</div>
            <div className="science-card-body">
              <h4>5. Mindfulness &amp; Nervous System Support</h4>
              <p>Breathing, grounding, and awareness tools help your body handle stress without reaching for nicotine — as a reset, not a replacement addiction.</p>
            </div>
          </div>
          <div className="science-card">
            <div className="science-card-icon">🛡️</div>
            <div className="science-card-body">
              <h4>6. Relapse Prevention</h4>
              <p>20 days of smoke-free reinforcement, mindfulness, and anti-relapse training after your quit day — because life still happens.</p>
            </div>
          </div>

          <div className="science-disclaimer">
            <strong>Note:</strong> Smono is a behavioural change and psychological support program. If you have a medical condition, use medication, are pregnant, or need clinical support, speak to a qualified healthcare professional.
          </div>
          <div className="section-cta"><a href={appStartHref()} className="btn-primary js-start-app">See My Personal Quit Path <span>→</span></a></div>
        </div>

      </div>
    </div>
  </section>

  {/* Why Smono */}
    </>
  )
}
