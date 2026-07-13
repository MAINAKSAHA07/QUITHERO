export function Showcase() {
  return (
    <>
<section className="showcase">
    <div className="container">
      <div className="showcase-row showcase-interactive">
        <div className="showcase-phone reveal reveal-left">
          <div className="phone phone-mini phone-2">
            <div className="phone-screen">
              <div className="phone-island"></div>
              <div className="phone-status"><span>9:41</span><span>●●● ⚡ 92%</span></div>
              <div className="phone-content" id="phone2Content">
                <div id="phone2ProgressView">
                  <div className="phone-days">
                    <div className="phone-days-num" id="mockupDaysNum">14</div>
                    <div className="phone-days-label">Days Smoke-Free</div>
                    <div className="phone-milestone" id="mockupMilestone" aria-live="polite"></div>
                  </div>
                  <div className="mini-card first">
                    <div className="mini-label">Money Saved</div>
                    <div className="mini-value secondary" id="mockupMoneySaved">₹3,360</div>
                  </div>
                  <div className="mini-card">
                    <div className="mini-label">Cigarettes Not Smoked</div>
                    <div className="mini-value primary" id="mockupCigsNotSmoked">280</div>
                  </div>
                  <div className="phone-notification" id="phone2Notification">
                    <div className="noti-icon">🛡️</div>
                    <div className="noti-text">
                      <div className="noti-title">Craving Rescued</div>
                      <div className="noti-sub" id="phone2NotiSub">Breathing reset completed</div>
                    </div>
                  </div>
                </div>
                <div className="phone-breath-overlay" id="phone2Breath" aria-hidden="true">
                  <div className="breath-session">
                    <div className="breath-session-top">
                      <p className="breath-round-label" id="breathRoundLabel">Round 1 of 5</p>
                      <div className="breath-dots" id="breathDots" aria-hidden="true"></div>
                      <p className="breath-555-tag">5-5-5 Breathing</p>
                    </div>
                    <div className="breath-orb-stage">
                      <div className="breath-glow" id="breathGlow"></div>
                      <div className="breath-mid" id="breathMid"></div>
                      <div className="breath-orb" id="breathOrb">
                        <div className="breath-orb-text">
                          <div className="breath-phase-title" id="breathPhase">Breathe In</div>
                          <div className="breath-phase-sub" id="breathSub">Slowly...</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="showcase-copy reveal reveal-right">
          <h3>Quit Without Feeling Deprived</h3>
          <p>You're not losing a friend, pleasure, or support system — you're removing a dependency that kept asking you to feed it. Track milestones as the desire fades.</p>
          <ul>
            <li>Daily smoke-free counter with milestone celebrations</li>
            <li>Real-time money saved and cigarettes not smoked</li>
            <li>Emergency craving button with guided breathing resets</li>
          </ul>
        </div>
        <div className="mockup-controls reveal" id="mockupControls">
          <p className="mockup-try-label">Try it — adjust your habit, then rescue a craving.</p>
          <div className="mockup-field">
            <label><span>Cigarettes per day</span><strong id="mockupCigsLabel">20</strong></label>
            <input type="range" id="mockupCigsPerDay" min="5" max="40" defaultValue="20" aria-label="Cigarettes per day" />
          </div>
          <div className="mockup-field">
            <label><span>Days smoke-free</span><strong id="mockupDaysLabel">14</strong></label>
            <input type="range" id="mockupDays" min="1" max="30" defaultValue="14" aria-label="Days smoke-free" />
          </div>
          <div className="mockup-actions">
            <button type="button" className="mockup-btn" id="mockupAddDay">+1 smoke-free day</button>
            <button type="button" className="mockup-btn primary" id="mockupRescue">Rescue a craving</button>
          </div>
        </div>
      </div>

      <div className="showcase-row reverse">
        <div className="showcase-phone reveal reveal-right">
          <div className="phone phone-mini phone-3">
            <div className="phone-screen">
              <div className="phone-island"></div>
              <div className="phone-status"><span>9:41</span><span>●●● ⚡ 78%</span></div>
              <div className="phone-content">
                <div className="phone-section-title">Trigger Breakdown</div>
                <div className="trigger-row">
                  <div className="trigger-info"><span>Stress</span><span>42%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-width="42"></div></div>
                </div>
                <div className="trigger-row">
                  <div className="trigger-info"><span>Habit</span><span>28%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-width="28"></div></div>
                </div>
                <div className="trigger-row">
                  <div className="trigger-info"><span>Social</span><span>18%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-width="18"></div></div>
                </div>
                <div className="trigger-row" style={{marginBottom: '0'}}>
                  <div className="trigger-info"><span>Boredom</span><span>12%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-width="12"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="showcase-copy reveal reveal-left">
          <h3>Handle Stress Without Smoking</h3>
          <p>Separate real stress from nicotine withdrawal stress. See when, where, and why you smoke — then break the pattern.</p>
          <ul>
            <li>Personal trigger mapping across stress, social, and routine moments</li>
            <li>Time-of-day craving patterns</li>
            <li>CBT-based thought reframing exercises</li>
          </ul>
        </div>
      </div>

      <div className="showcase-row">
        <div className="showcase-phone reveal reveal-left">
          <div className="phone phone-mini phone-4">
            <div className="phone-screen">
              <div className="phone-island"></div>
              <div className="phone-status"><span>9:41</span><span>●●● ⚡ 95%</span></div>
              <div className="phone-content">
                <div className="phone-section-title">Belief Assessment</div>
                <div className="belief-row">
                  <div className="mini-label">"Smoking relaxes me"</div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-before="90" data-after="30"></div></div>
                  <div className="belief-row-meta">Day 0: 9 → Now: 3</div>
                </div>
                <div className="belief-row">
                  <div className="mini-label">"I enjoy smoking"</div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-before="80" data-after="20"></div></div>
                  <div className="belief-row-meta">Day 0: 8 → Now: 2</div>
                </div>
                <div className="belief-row">
                  <div className="mini-label">"Helps me concentrate"</div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-before="70" data-after="40"></div></div>
                  <div className="belief-row-meta">Day 0: 7 → Now: 4</div>
                </div>
                <div className="belief-row" style={{marginBottom: '0'}}>
                  <div className="mini-label">"Handles my stress"</div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '0%'}} data-before="100" data-after="30"></div></div>
                  <div className="belief-row-meta">Day 0: 10 → Now: 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="showcase-copy reveal reveal-right">
          <h3>Protect Yourself From "Just One"</h3>
          <p>Most relapses begin with one thought. Smono trains you to understand why that cigarette matters — and how to protect your freedom when it appears.</p>
          <ul>
            <li>Belief strength tracking across your quit journey</li>
            <li>Anti-relapse library for parties, alcohol, and stress</li>
            <li>Smoke-free identity building — not "trying not to smoke"</li>
          </ul>
          <div className="section-cta"><button className="btn-primary js-start-app">Become Smoke-Free <span>→</span></button></div>
        </div>
      </div>
    </div>
  </section>

  {/* Emotional Promise */}
    </>
  )
}
