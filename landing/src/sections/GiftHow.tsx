const STEPS = [
  {
    n: '01',
    title: 'You gift the program',
    body: 'Enter your details and theirs, add an optional note, and complete a secure payment. They receive the invitation — only they unlock Smono.',
  },
  {
    n: '02',
    title: 'They receive a private invite',
    body: 'An email arrives with your name, your note, and a claim link. Nothing public. No social post. Just a quiet invitation.',
  },
  {
    n: '03',
    title: 'They claim and begin',
    body: 'They sign in with the email you entered, claim the gift, and start Day 1 when they choose — calmly, privately.',
  },
] as const

export function GiftHow() {
  return (
    <section className="gift-how" id="gift-how">
      <div className="container">
        <h2 className="section-title reveal">How gifting works</h2>
        <p className="section-sub reveal">
          Three steps. No awkward handoff. They stay in control of when they begin.
        </p>
        <ol className="gift-how-list">
          {STEPS.map((step) => (
            <li key={step.n} className="gift-how-step reveal gift-step-reveal">
              <span className="gift-how-num" aria-hidden="true">
                {step.n}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
