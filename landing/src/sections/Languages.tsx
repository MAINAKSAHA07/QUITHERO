import { appStartHref } from '../lib/appUrl'
const LANGUAGES = [
  { flag: '🇺🇸', name: 'English', sample: 'Choose your language' },
  { flag: '🇮🇳', name: 'हिंदी', sample: 'अपनी भाषा चुनें' },
  { flag: '🇮🇳', name: 'मराठी', sample: 'तुमची भाषा निवडा' },
  { flag: '🇮🇳', name: 'ગુજરાતી', sample: 'તમારી ભાષા પસંદ કરો' },
  { flag: '🇪🇸', name: 'Español', sample: 'Elige tu idioma' },
  { flag: '🇫🇷', name: 'Français', sample: 'Choisissez votre langue' },
  { flag: '🇩🇪', name: 'Deutsch', sample: 'Sprache wählen' },
  { flag: '🇮🇹', name: 'Italiano', sample: 'Scegli la lingua' },
  { flag: '🇨🇳', name: '中文', sample: '选择您的语言' },
] as const

export function Languages() {
  return (
    <section className="languages-section" id="languages">
      <div className="container">
        <div className="languages-layout">
          <div className="languages-copy reveal reveal-left">
            <span className="languages-eyebrow">🌍 Built for real life, everywhere</span>
            <h2 className="section-title languages-title">Your quit journey in your language</h2>
            <p className="section-sub languages-sub">
              Pick a language once — onboarding, daily lessons, reflections, and support all follow you.
              No English-only barrier when you&apos;re ready to quit.
            </p>
            <ul className="languages-points">
              <li>Onboarding &amp; KYC questions in your language</li>
              <li>Daily CBT sessions, quizzes &amp; journal prompts translated</li>
              <li>Switch anytime from Profile — your progress stays saved</li>
            </ul>
            <a href={appStartHref()} className="btn-primary js-start-app">
              Start in your language <span>→</span>
            </a>
          </div>

          <div className="languages-visual reveal reveal-right">
            <div className="lang-picker-card">
              <div className="lang-picker-head">
                <img src="/mascot.png" alt="" className="lang-picker-mascot" role="presentation" />
                <div>
                  <p className="lang-picker-title">Choose Your Language</p>
                  <p className="lang-picker-hint">You can change this later in settings</p>
                </div>
              </div>
              <ul className="lang-list" aria-label="Supported languages">
                {LANGUAGES.map((lang, i) => (
                  <li key={lang.name} className={`lang-row${i === 0 ? ' lang-row-active' : ''}`}>
                    <span className="lang-flag" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <span className="lang-name">{lang.name}</span>
                    <span className="lang-sample">{lang.sample}</span>
                    {i === 0 ? (
                      <span className="lang-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="lang-picker-foot">9 languages · English, Hindi, Marathi, Gujarati &amp; more</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
