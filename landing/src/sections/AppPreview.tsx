export function AppPreview() {
  return (
    <>
<section className="app-preview" id="app-preview">
    <div className="container">
      <h2 className="section-title reveal">Your Personal Quit Dashboard</h2>
      <p className="section-sub reveal">Daily lessons, trigger reflection, mindfulness tools, and emergency craving support — designed for busy people who want deep change without complicated routines.</p>
      <div className="app-mockup-grid">
        {/* Home */}
        <div className="app-mockup-card reveal">
          <div
            className="phone phone-gallery phone-home"
            role="img"
            aria-label="Smono home screen showing Day 2 of the 30-day quit program, cigarettes avoided, money saved, and quick craving actions"
          >
            <div className="phone-screen has-tabbar">
              <div className="phone-island"></div>
              <div className="phone-status"><span>9:41</span><span>●●● ⚡ 92%</span></div>
              <div className="phone-content">
                <div className="app-header">
                  <div className="app-icon-btn">☰</div>
                  <div className="app-header-center">
                    <img src="mascot.png" alt="Smono mascot" className="app-header-mascot" />
                    <span className="smono-wordmark" aria-hidden="true">
                      <span className="sm">sm</span>
                      <svg className="logo-o" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="38" stroke="#A8D4EA" strokeWidth="10"/><rect x="60" y="46" width="16" height="8" fill="#FDB47B" rx="1"/><rect x="24" y="46" width="36" height="8" fill="#DCE8EE" rx="1"/><line x1="23" y1="23" x2="77" y2="77" stroke="#A8D4EA" strokeWidth="10" strokeLinecap="round"/></svg>
                      <span className="no">no</span>
                    </span>
                  </div>
                  <div className="app-icon-btn">↻</div>
                </div>
                <div className="stat-grid">
                  <div className="stat-tile"><div className="val">2</div><div className="lbl">Day · Program</div></div>
                  <div className="stat-tile"><div className="val peach">2</div><div className="lbl">Cigs Avoided</div></div>
                  <div className="stat-tile"><div className="val sage">₹24</div><div className="lbl">Money Saved</div></div>
                  <div className="stat-tile"><div className="val">1.6mg</div><div className="lbl">Nicotine Avoided</div></div>
                </div>
                <div className="program-card">
                  <div className="program-card-top">
                    <div>
                      <div className="program-eyebrow">30-DAY PROGRAM</div>
                      <div className="program-day">Day 2</div>
                    </div>
                    <img src="mascot.png" alt="Smono mascot on program progress card" className="program-mascot" />
                  </div>
                  <div className="program-pct">7% complete</div>
                  <div className="program-bar-wrap"><div className="program-bar"><div className="program-bar-fill" style={{width: '7%'}}></div></div></div>
                  <div className="program-cta">Continue Program →</div>
                </div>
                <div className="today-row">
                  <span className="today-pill resisted">🛡 2 resisted</span>
                  <span className="today-pill slipped">🚬 1 slipped</span>
                </div>
                <div className="quick-grid">
                  <div className="quick-btn"><span className="qb-icon">🛡</span>Resisted</div>
                  <div className="quick-btn"><span className="qb-icon">🌬</span>Breathe</div>
                  <div className="quick-btn"><span className="qb-icon">🚬</span>Log Slip</div>
                  <div className="quick-btn"><span className="qb-icon">＋</span>Craving</div>
                </div>
              </div>
              <div className="app-tabbar">
                <div className="tab-item active">Home</div>
                <div className="tab-item">Sessions</div>
                <div className="tab-fab-slot"><div className="tab-fab">+</div></div>
                <div className="tab-item">Progress</div>
                <div className="tab-item">Profile</div>
              </div>
            </div>
          </div>
          <p className="app-mockup-caption">Dashboard<span>Daily progress, milestones, and support reminders</span></p>
        </div>

        {/* Sessions */}
        <div className="app-mockup-card reveal">
          <div
            className="phone phone-gallery"
            role="img"
            aria-label="Smono sessions screen listing daily CBT lessons in the 30-day quit program"
          >
            <div className="phone-screen has-tabbar">
              <div className="phone-island"></div>
              <div className="phone-status"><span>9:41</span><span>●●● ⚡ 88%</span></div>
              <div className="phone-content">
                <div className="app-header">
                  <div className="app-icon-btn">☰</div>
                  <div className="app-header-center">
                    <img src="mascot.png" alt="Smono mascot" className="app-header-mascot" />
                    <span className="smono-wordmark" aria-hidden="true">
                      <span className="sm">sm</span>
                      <svg className="logo-o" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="38" stroke="#A8D4EA" strokeWidth="10"/><rect x="60" y="46" width="16" height="8" fill="#FDB47B" rx="1"/><rect x="24" y="46" width="36" height="8" fill="#DCE8EE" rx="1"/><line x1="23" y1="23" x2="77" y2="77" stroke="#A8D4EA" strokeWidth="10" strokeLinecap="round"/></svg>
                      <span className="no">no</span>
                    </span>
                  </div>
                  <div className="app-icon-btn">↻</div>
                </div>
                <div className="phone-section-title" style={{marginTop: '4px'}}>30-Day Program</div>
                <div className="session-item done">
                  <div className="session-num">✓</div>
                  <div className="session-info">
                    <div className="session-title">Day 1 — Your Journey</div>
                    <div className="session-sub">Completed · 18 min</div>
                  </div>
                  <span className="session-badge done">Done</span>
                </div>
                <div className="session-item done">
                  <div className="session-num">✓</div>
                  <div className="session-info">
                    <div className="session-title">Day 2 — How Nicotine Hooks</div>
                    <div className="session-sub">Completed · 32 min</div>
                  </div>
                  <span className="session-badge done">Done</span>
                </div>
                <div className="session-item current active-item">
                  <div className="session-num">3</div>
                  <div className="session-info">
                    <div className="session-title">Day 3 — The Pleasure Illusion</div>
                    <div className="session-sub">In progress · ~29 min</div>
                  </div>
                  <span className="session-badge now">Now</span>
                </div>
                <div className="session-item">
                  <div className="session-num">4</div>
                  <div className="session-info">
                    <div className="session-title">Day 4 — The Relaxation Myth</div>
                    <div className="session-sub">Locked</div>
                  </div>
                </div>
                <div className="session-item" style={{opacity: '0.55'}}>
                  <div className="session-num">5</div>
                  <div className="session-info">
                    <div className="session-title">Day 5 — Concentration & Boredom</div>
                    <div className="session-sub">Locked</div>
                  </div>
                </div>
              </div>
              <div className="app-tabbar">
                <div className="tab-item">Home</div>
                <div className="tab-item active">Sessions</div>
                <div className="tab-fab-slot"><div className="tab-fab">+</div></div>
                <div className="tab-item">Progress</div>
                <div className="tab-item">Profile</div>
              </div>
            </div>
          </div>
          <p className="app-mockup-caption">Daily Lessons<span>Short modules that change how you see smoking</span></p>
        </div>

        {/* Progress */}
        <div className="app-mockup-card reveal">
          <div
            className="phone phone-gallery"
            role="img"
            aria-label="Smono progress screen with craving trend chart and trigger breakdown for stress, habit, social, and boredom"
          >
            <div className="phone-screen has-tabbar">
              <div className="phone-island"></div>
              <div className="phone-status"><span>9:41</span><span>●●● ⚡ 95%</span></div>
              <div className="phone-content">
                <div className="app-header">
                  <div className="app-icon-btn">☰</div>
                  <div className="app-header-center">
                    <img src="mascot.png" alt="Smono mascot" className="app-header-mascot" />
                    <span className="smono-wordmark" aria-hidden="true">
                      <span className="sm">sm</span>
                      <svg className="logo-o" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="38" stroke="#A8D4EA" strokeWidth="10"/><rect x="60" y="46" width="16" height="8" fill="#FDB47B" rx="1"/><rect x="24" y="46" width="36" height="8" fill="#DCE8EE" rx="1"/><line x1="23" y1="23" x2="77" y2="77" stroke="#A8D4EA" strokeWidth="10" strokeLinecap="round"/></svg>
                      <span className="no">no</span>
                    </span>
                  </div>
                  <div className="app-icon-btn">↻</div>
                </div>
                <div className="phone-section-title" style={{marginTop: '4px'}}>Craving Trend</div>
                <div className="chart-area" aria-hidden="true">
                  <div className="chart-bar" style={{height: '35%'}}></div>
                  <div className="chart-bar" style={{height: '55%'}}></div>
                  <div className="chart-bar" style={{height: '42%'}}></div>
                  <div className="chart-bar" style={{height: '68%'}}></div>
                  <div className="chart-bar" style={{height: '38%'}}></div>
                  <div className="chart-bar" style={{height: '28%'}}></div>
                  <div className="chart-bar" style={{height: '22%'}}></div>
                </div>
                <div className="phone-section-title">Trigger Breakdown</div>
                <div className="trigger-row">
                  <div className="trigger-info"><span>Stress</span><span>42%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '42%'}}></div></div>
                </div>
                <div className="trigger-row">
                  <div className="trigger-info"><span>Habit</span><span>28%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '28%'}}></div></div>
                </div>
                <div className="trigger-row">
                  <div className="trigger-info"><span>Social</span><span>18%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '18%'}}></div></div>
                </div>
                <div className="trigger-row" style={{marginBottom: '0'}}>
                  <div className="trigger-info"><span>Boredom</span><span>12%</span></div>
                  <div className="mini-bar"><div className="mini-bar-fill" style={{width: '12%'}}></div></div>
                </div>
              </div>
              <div className="app-tabbar">
                <div className="tab-item">Home</div>
                <div className="tab-item">Sessions</div>
                <div className="tab-fab-slot"><div className="tab-fab">+</div></div>
                <div className="tab-item active">Progress</div>
                <div className="tab-item">Profile</div>
              </div>
            </div>
          </div>
          <p className="app-mockup-caption">Trigger Reflection<span>Stress, social, food, alcohol, boredom, and routine patterns</span></p>
        </div>
      </div>
    </div>
  </section>

  {/* Showcase */}
    </>
  )
}
