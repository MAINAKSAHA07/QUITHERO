import { FAQ_ITEMS } from '../lib/seo.config'

type FaqItem = { question: string; answer: string }

type Props = {
  items?: readonly FaqItem[]
  title?: string
  sub?: string
}

export function Faq({
  items = FAQ_ITEMS,
  title = 'Frequently asked questions',
  sub = 'Everything you need to know before you begin your reset.',
}: Props) {
  return (
    <section className="faq" id="faq">
      <div className="container">
        <h2 className="section-title reveal">{title}</h2>
        <p className="section-sub reveal">{sub}</p>
        <div className="faq-list">
          {items.map((item) => (
            <div key={item.question} className="faq-item reveal">
              <button className="faq-question" aria-expanded="false">
                <h3 className="faq-question-text">{item.question}</h3>
                <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="faq-answer" role="region">
                <div className="faq-answer-inner">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
