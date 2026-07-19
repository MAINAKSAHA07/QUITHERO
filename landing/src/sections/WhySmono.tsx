import { appStartHref } from '../lib/appUrl'

const POINTS = [
  {
    title: 'No Willpower Battles',
    body: 'Willpower means fighting the desire every day — and that is exhausting. Smono works on the desire itself. When cigarettes stop feeling useful, you do not need to fight as hard.',
  },
  {
    title: 'No Guilt. No Shame. No Judgement.',
    body: 'Smoking is not a personality flaw or proof you are weak. It is a learned pattern reinforced by nicotine, emotion, repetition, and belief. Smono helps you unlearn it with respect.',
  },
  {
    title: 'No Gums, Vapes, or Patches',
    body: 'Smono does not replace cigarettes with another nicotine habit. The aim is freedom from nicotine — not a new version of the same cycle.',
  },
  {
    title: 'No Lifestyle Overhaul',
    body: 'You do not have to hide from friends, skip parties, or avoid every chai break or stressful day. Smono prepares you to live your normal life without needing cigarettes inside it.',
  },
  {
    title: 'No Cigarette Tracking',
    body: 'Counting cigarettes can feel obsessive and guilt-heavy. Smono does not make quitting feel like homework — short daily lessons and reflections shift how you think about smoking instead.',
  },
  {
    title: 'No Forced Quit on Day 1',
    body: 'You can keep smoking in the early days while you learn to see cigarettes differently. That lowers panic and pressure — so by quit day, smoking no longer feels the same.',
  },
] as const

export function WhySmono() {
  return (
    <section className="content-section" id="why-smono" style={{ background: 'rgba(255,255,255,0.35)' }}>
      <div className="container">
        <h2 className="section-title reveal">What Makes Smono Different?</h2>
        <p className="section-sub reveal">
          Most quit methods ask you to fight harder. Smono helps you want cigarettes less — so quitting stops feeling like punishment.
        </p>
        <div className="how-steps" style={{ marginTop: '48px' }}>
          {POINTS.map((point) => (
            <div key={point.title} className="step-card border-glow reveal">
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </div>
          ))}
        </div>
        <div className="section-cta reveal" style={{ textAlign: 'center' }}>
          <a href={appStartHref()} className="btn-primary js-start-app">
            Start Without Pressure <span>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
