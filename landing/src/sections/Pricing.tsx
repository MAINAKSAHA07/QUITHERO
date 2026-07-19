import { appStartHref } from '../lib/appUrl'
export function Pricing() {
  return (
    <>
<section className="pricing" id="pricing">
    <div className="container">
      <h2 className="section-title reveal">What You Get Inside Smono</h2>
      <p className="section-sub reveal">A simple program that fits into real life. Most daily sessions take 20 to 40 minutes — you do not need to be perfect, only committed.</p>
      <div className="pricing-card reveal">
        <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap'}}>
          <span className="pricing-badge">10-Day Quit Program</span>
          <span className="pricing-badge" style={{background: 'rgba(56,189,248,0.1)', color: 'var(--primary)', borderColor: 'rgba(56,189,248,0.25)'}}>20-Day Support</span>
        </div>
        <h3 className="pricing-name">Smono Complete Program</h3>

        <div className="pricing-original" id="priceOriginal">₹3,999</div>
        <div className="pricing-price" id="pricePromo">₹1,999<span style={{fontSize: '1.1rem', fontWeight: 500, color: 'var(--muted)'}}>/month</span></div>
        <div className="pricing-caption">
          Billed monthly — the full program is 30 days, so you won&apos;t need more than one month.
          Cancel anytime.
        </div>
        
        <div className="pricing-comparison">
          <div className="comparison-item bad">
            <span className="comp-title" id="comparisonBadTitle">17 Days of Cigarettes</span>
            <span className="comp-cost" id="priceComparisonBad">₹2,040</span>
          </div>
          <div className="comparison-divider">vs</div>
          <div className="comparison-item good">
            <span className="comp-title">Smono — 1 month</span>
            <span className="comp-cost" id="priceComparisonGood">₹1,999</span>
          </div>
        </div>

        <div className="pricing-savings" id="priceSavingsText">Less than 17 days of cigarettes. Pays for itself in a week.</div>
        <ul className="pricing-features">
          <li><span className="pricing-check">✓</span> Daily app-based lessons &amp; guided exercises</li>
          <li><span className="pricing-check">✓</span> Personal trigger reflection &amp; CBT thought reframing</li>
          <li><span className="pricing-check">✓</span> Mindfulness, relaxation &amp; final cigarette preparation</li>
          <li><span className="pricing-check">✓</span> Anti-relapse training &amp; smoke-free identity building</li>
          <li><span className="pricing-check">✓</span> Emergency craving support &amp; progress milestones</li>
          <li><span className="pricing-check">✓</span> Optional personal consultations</li>
        </ul>
        <div className="pricing-coupon">
          <label htmlFor="priceCoupon">Coupon code</label>
          <div className="pricing-coupon-row">
            <input
              id="priceCoupon"
              type="text"
              placeholder="Optional"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" id="priceCouponApply" className="pricing-coupon-apply">
              Apply
            </button>
          </div>
          <p id="priceCouponHint" className="pricing-coupon-hint" hidden />
        </div>
        <button type="button" className="pricing-cta" id="pricePayCta">
          Pay &amp; unlock — <span id="pricePayLabel">₹1,999</span>
        </button>
        <p id="pricePayError" className="pricing-pay-error" hidden role="alert" />
        <a href={appStartHref()} className="pricing-secondary-cta js-start-app" id="priceCta">
          Or start free Day 1 in the app
        </a>
        <div className="pricing-trust-row">
          <div className="trust-pill">🔒 Secure payment</div>
          <div className="trust-pill">⚡ 20–40 min daily sessions</div>
          <div className="trust-pill">🌍 Private &amp; judgement-free</div>
        </div>
        <p className="pricing-trust">Complete the full program for the best results.</p>
      </div>
    </div>
  </section>
    </>
  )
}
