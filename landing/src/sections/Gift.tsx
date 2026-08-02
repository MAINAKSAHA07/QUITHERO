type GiftProps = {
  /** Standalone /gift page uses h1; default h2 if reused elsewhere. */
  headingLevel?: 'h1' | 'h2'
}

export function Gift({ headingLevel = 'h2' }: GiftProps = {}) {
  const Heading = headingLevel
  // Standalone /gift is above the fold — never start at opacity 0 waiting on JS.
  const reveal = headingLevel !== 'h1'
  return (
    <section className="gift" id="gift">
      <div className="gift-atmosphere" aria-hidden="true" />
      <div className="container gift-layout">
        <div className={reveal ? 'gift-copy reveal reveal-left' : 'gift-copy'}>
          <div className="gift-visual" aria-hidden="true">
            <img
              src="/mascot.png"
              alt=""
              className="gift-mascot"
              width={1024}
              height={1024}
              decoding="async"
            />
          </div>
          <p className="gift-kicker">Smono, for someone you love</p>
          <Heading className="section-title">Gift a new life</Heading>
          <p className="gift-lede">
            Help someone you care about stop wanting cigarettes—not through pressure, but with
            a calm 30-day path they can begin in private.
          </p>
          <p className="gift-access">
            Their invitation arrives by email with your personal note. Only they unlock the
            program — you give the gift, they begin when ready.
          </p>
        </div>

        <form
          className={reveal ? 'gift-form reveal reveal-right' : 'gift-form'}
          id="giftForm"
          noValidate
        >
          <div className="gift-field-row">
            <label>
              <span>Your name</span>
              <input id="giftBuyerName" name="buyerName" autoComplete="name" required />
            </label>
            <label>
              <span>Your email</span>
              <input id="giftBuyerEmail" name="buyerEmail" type="email" autoComplete="email" required />
            </label>
          </div>
          <div className="gift-field-row">
            <label>
              <span>Their name</span>
              <input id="giftRecipientName" name="recipientName" autoComplete="off" required />
            </label>
            <label>
              <span>Their email</span>
              <input id="giftRecipientEmail" name="recipientEmail" type="email" autoComplete="off" required />
            </label>
          </div>
          <label>
            <span>A short note <small>optional</small></span>
            <textarea
              id="giftMessage"
              name="message"
              maxLength={500}
              rows={3}
              placeholder="I’m with you. Take this one day at a time."
            />
          </label>
          <label>
            <span>Coupon code <small>optional</small></span>
            <input id="giftCoupon" name="coupon" autoComplete="off" spellCheck={false} />
          </label>
          <button className="gift-pay" id="giftPayCta" type="submit">
            Gift Smono — <span id="giftPayLabel">₹1,999</span>
          </button>
          <p className="gift-error" id="giftPayError" role="alert" hidden />
          <div className="gift-success" id="giftPaySuccess" hidden>
            <p className="gift-success-title">Gift sent</p>
            <p className="gift-success-body" id="giftPaySuccessBody">
              Their invitation is on the way. Only they can claim and unlock the program.
            </p>
          </div>
          <p className="gift-trust">
            Secure payment by Razorpay. The recipient only sees your name, note, and invitation.
          </p>
        </form>
      </div>
    </section>
  )
}
