import { useEffect, useRef, useState } from 'react'

const GUEST_KEY = 'smono_landing_coach_guest'
const OPEN_EVENT = 'smono:open-coach'

type ChatMessage = { role: 'user' | 'assistant'; body: string }

function getOrCreateGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY)
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 32)
        : `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(GUEST_KEY, id)
    return id
  } catch {
    return `g${Date.now().toString(36)}`
  }
}

type LandingCoachProps = {
  buyMode?: boolean
}

export function LandingCoach({ buyMode = false }: LandingCoachProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [remaining, setRemaining] = useState(10)
  const [limitReached, setLimitReached] = useState(false)
  const [upsell, setUpsell] = useState('')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const guestId = useRef(getOrCreateGuestId())

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open || loaded) return
    let cancelled = false
    ;(async () => {
      try {
        const page = window.location.pathname || '/'
        const res = await fetch(
          `/api/landing-coach/session?guest_id=${encodeURIComponent(guestId.current)}&page=${encodeURIComponent(page)}`
        )
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) throw new Error(data.error || 'Could not open coach')
        setMessages(Array.isArray(data.messages) ? data.messages : [])
        setRemaining(Number(data.remaining) || 0)
        setLimitReached(Boolean(data.limitReached))
        if (data.limitReached) {
          setUpsell(
            data.upsell ||
              'You’ve used your 10 free coach messages. Unlock Smono for deeper, ongoing quit support.'
          )
        }
        setLoaded(true)
      } catch (err: any) {
        if (!cancelled) setError(String(err?.message || 'Could not open coach'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, loaded])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, open, busy])

  const onBuy = () => {
    if (buyMode) {
      setOpen(false)
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
      const pay = document.getElementById('pricePayCta') as HTMLButtonElement | null
      window.setTimeout(() => pay?.click(), 400)
      return
    }
    window.location.hash = 'pricing'
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  const send = async () => {
    const text = input.trim()
    if (!text || busy || limitReached) return
    setError('')
    setBusy(true)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', body: text }])
    try {
      const res = await fetch('/api/landing-coach/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guestId.current,
          body: text,
          page: window.location.pathname || '/',
          languageCode: 'en',
          languageName: 'English',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`)
      if (Array.isArray(data.messages)) setMessages(data.messages)
      setRemaining(Number(data.remaining) || 0)
      setLimitReached(Boolean(data.limitReached))
      if (data.upsell) setUpsell(String(data.upsell))
      else if (data.limitReached) {
        setUpsell('You’ve used your 10 free coach messages. Unlock Smono for deeper, ongoing quit support.')
      }
    } catch (err: any) {
      setError(String(err?.message || 'Could not send'))
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="landing-coach-fab"
        aria-label="Talk to a Quit Coach"
        onClick={() => setOpen(true)}
      >
        Quit Coach
      </button>

      {open && (
        <div className="landing-coach-panel" role="dialog" aria-label="Quit Coach chat">
          <div className="landing-coach-head">
            <div>
              <strong>Quit Coach</strong>
              <span>
                {limitReached
                  ? 'Free messages used'
                  : `${remaining} free message${remaining === 1 ? '' : 's'} left`}
              </span>
            </div>
            <button type="button" className="landing-coach-close" aria-label="Close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="landing-coach-messages" ref={listRef}>
            {messages.length === 0 && !busy && (
              <p className="landing-coach-empty">
                Ask anything about quitting — cravings, where to start, or what Smono does.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`landing-coach-bubble ${m.role}`}>
                {m.body}
              </div>
            ))}
            {busy && <div className="landing-coach-bubble assistant is-typing">Typing…</div>}
          </div>

          {(limitReached || upsell) && (
            <div className="landing-coach-upsell">
              <p>{upsell || 'Unlock Smono for deeper, ongoing quit support.'}</p>
              <button type="button" onClick={onBuy}>
                {buyMode ? 'Buy Smono now' : 'See pricing & unlock'}
              </button>
            </div>
          )}

          {error && (
            <p className="landing-coach-error" role="alert">
              {error}
            </p>
          )}

          <form
            className="landing-coach-compose"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={limitReached ? 'Unlock Smono to continue' : 'Write a message…'}
              disabled={busy || limitReached}
              maxLength={2000}
              aria-label="Message"
            />
            <button type="submit" disabled={busy || limitReached || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export { OPEN_EVENT as LANDING_COACH_OPEN_EVENT }
