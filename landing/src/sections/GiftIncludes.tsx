const INCLUDES = [
  {
    title: '10-day quit path',
    body: 'Daily CBT-based sessions that soften the desire to smoke — not another willpower fight.',
  },
  {
    title: '20 days of support',
    body: 'Craving tools, relapse protection, and reinforcement until freedom feels ordinary.',
  },
  {
    title: 'Private and personal',
    body: 'Onboarding, sessions, and support in their language. No judgement. No nicotine substitutes.',
  },
  {
    title: 'For them, not you',
    body: 'The purchase unlocks the complete program for the recipient only. You give the gift; they claim it.',
  },
] as const

export function GiftIncludes() {
  return (
    <section className="gift-includes" id="gift-includes">
      <div className="container">
        <h2 className="section-title reveal">What they receive</h2>
        <p className="section-sub reveal">
          A full 30-day Smono program — the same path on the homepage, given as care.
        </p>
        <ul className="gift-includes-list">
          {INCLUDES.map((item) => (
            <li key={item.title} className="reveal">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
