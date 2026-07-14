import { FAQ_ITEMS } from '../lib/seo.config'

export function Faq() {
  return (
    <section className="faq" id="faq">
      <div className="container">
        <h2 className="section-title reveal">Frequently asked questions</h2>
        <p className="section-sub reveal">Everything you need to know before you begin your reset.</p>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="faq-item reveal">
              <button className="faq-question" aria-expanded="false">
                <h3 className="faq-question-text">{item.question}</h3>
                <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="faq-answer" role="region">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
