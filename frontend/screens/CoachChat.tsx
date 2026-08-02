import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, MicOff, Send, Volume2, VolumeX, UserRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  loadCoachSession,
  requestHumanSpecialist,
  runCoachAiTurn,
  saveAssistantMessage,
  sendCoachUserMessage,
  type CoachMessage,
  type CoachSession,
} from '../services/coach.service'
import {
  coachSpeechSupported,
  isCoachTtsMuted,
  setCoachTtsMuted,
  speakCoachText,
  startCoachListening,
} from '../utils/coachVoice'
import { coachTypingDelayMs } from '../utils/coachHumanPace'

export default function CoachChat() {
  const navigate = useNavigate()
  const { user, userProfile, currentSession } = useApp()
  const [session, setSession] = useState<CoachSession | null>(null)
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [ttsMuted, setTtsMuted] = useState(isCoachTtsMuted())
  const [suggestHuman, setSuggestHuman] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listenCtl = useRef<ReturnType<typeof startCoachListening> | null>(null)
  const speech = coachSpeechSupported()

  const enabled = !!userProfile?.enable_coach_chat

  const refresh = useCallback(async () => {
    const res = await loadCoachSession()
    if (!res.ok) {
      setError(res.error)
      if (res.status === 403) navigate('/home', { replace: true })
      return
    }
    setSession(res.data.session)
    setMessages(res.data.messages || [])
    setError('')
  }, [navigate])

  useEffect(() => {
    if (!enabled) {
      navigate('/home', { replace: true })
      return
    }
    void refresh()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 8000)
    return () => window.clearInterval(id)
  }, [enabled, navigate, refresh])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  if (!enabled || !user?.id) return null

  const humanMode = session?.mode === 'human'
  const lang = userProfile?.language || 'en'

  const sendText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy || !user?.id) return
    setBusy(true)
    setError('')
    setDraft('')

    const sent = await sendCoachUserMessage(trimmed)
    if (!sent.ok) {
      setError(sent.error)
      setBusy(false)
      setDraft(trimmed)
      return
    }

    setMessages((prev) => [...prev, sent.data.message])
    setSession(sent.data.session)

    if (!sent.data.needsAi || sent.data.session.mode === 'human') {
      setBusy(false)
      return
    }

    const history = [...messages, sent.data.message].slice(-20).map((m) => ({
      role: m.role === 'human' ? 'assistant' : m.role,
      content: m.body,
    }))

    const ai = await runCoachAiTurn({
      userId: user.id,
      profile: userProfile,
      messages: history,
      latestUserMessage: trimmed,
    })

    if (!ai.ok) {
      if (ai.status === 409) {
        setSession((s) => (s ? { ...s, mode: 'human' } : s))
        setError('A specialist is connected — AI is paused.')
      } else {
        setError(ai.error)
      }
      setBusy(false)
      void refresh()
      return
    }

    // Pause so it feels like someone typing, not an instant bot dump
    await new Promise((r) => window.setTimeout(r, coachTypingDelayMs(ai.reply)))

    const saved = await saveAssistantMessage(ai.reply, sent.data.session.id, user.id)
    if (saved.ok) {
      setMessages((prev) => [...prev, saved.message])
      if (!ttsMuted) speakCoachText(ai.reply, lang)
    } else {
      setError(saved.error)
    }
    if (ai.suggest_specialist) setSuggestHuman(true)
    setBusy(false)
  }

  const onRequestHuman = async () => {
    if (busy) return
    if (!window.confirm('Connect you with a specialist? The AI Coach will pause in this chat.')) return
    setBusy(true)
    const res = await requestHumanSpecialist()
    setBusy(false)
    setSuggestHuman(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    await refresh()
  }

  const toggleMic = async () => {
    if (listening) {
      listenCtl.current?.stop()
      setListening(false)
      return
    }
    setListening(true)
    setError('')
    const ctl = startCoachListening(lang)
    listenCtl.current = ctl
    try {
      const text = await ctl.done
      setListening(false)
      if (text) await sendText(text)
    } catch (e: any) {
      setListening(false)
      setError(e?.message || 'Could not hear you')
    }
  }

  const toggleTts = () => {
    const next = !ttsMuted
    setCoachTtsMuted(next)
    setTtsMuted(next)
  }

  const iconBtn =
    'w-10 h-10 rounded-full bg-[#F4FBFF] border border-[#0E2538]/06 flex items-center justify-center transition-transform duration-100 ease-out active:scale-[0.97]'

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-md mx-auto flex flex-col overflow-hidden bg-[#F4FBFF]">
      {/* Translucent chrome — content scrolls underneath */}
      <header className="flex-shrink-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#0E2538]/06 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="px-3 py-2.5 flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className={iconBtn} aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-[#0E2538]" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-semibold tracking-tight text-[#0E2538] leading-tight">Coach</h1>
            <p className="text-[11px] text-[#0E2538]/50 truncate leading-snug mt-0.5">
              {humanMode ? 'Specialist connected — AI paused' : 'Here to support your quit journey'}
            </p>
          </div>
          {speech.tts ? (
            <button type="button" onClick={toggleTts} className={iconBtn} aria-label="Toggle speak">
              {ttsMuted ? (
                <VolumeX className="w-4 h-4 text-[#0E2538]/55" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#3F8DD2]" />
              )}
            </button>
          ) : null}
        </div>
      </header>

      {humanMode ? (
        <div className="mx-3 mt-3 flex-shrink-0 rounded-2xl bg-amber-50/95 border border-amber-200/80 text-amber-950 text-xs px-3.5 py-2.5 leading-relaxed">
          A specialist is in this chat. Keep messaging — the AI Coach stays paused until they release.
        </div>
      ) : null}

      {suggestHuman && !humanMode ? (
        <div className="mx-3 mt-3 flex-shrink-0 rounded-2xl bg-[#E8F4FC] border border-[#3F8DD2]/25 text-[#0E2538] text-xs px-3.5 py-2.5 flex items-center justify-between gap-3">
          <span className="min-w-0 leading-relaxed">Want a human specialist?</span>
          <button
            type="button"
            onClick={onRequestHuman}
            className="font-semibold text-[#3F8DD2] shrink-0 px-2 py-1 rounded-lg active:scale-[0.97] transition-transform duration-100"
          >
            Connect
          </button>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-2.5">
        {messages.length === 0 && !busy ? (
          <div className="text-center py-14 px-5 space-y-2">
            <p className="text-[15px] font-semibold text-[#0E2538]">What’s on your mind?</p>
            <p className="text-sm text-[#0E2538]/45 leading-relaxed">
              Cravings, wins, hard moments — I’m listening.
            </p>
          </div>
        ) : null}
        {messages.map((m) => {
          const mine = m.role === 'user'
          const human = m.role === 'human'
          return (
            <div key={m.id} className={`flex min-w-0 ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`min-w-0 max-w-[min(85%,20rem)] rounded-[1.15rem] px-3.5 py-2.5 text-[15px] leading-relaxed ${
                  mine
                    ? 'bg-[#3F8DD2] text-white rounded-br-md'
                    : human
                      ? 'bg-[#0E2538] text-white rounded-bl-md'
                      : 'bg-white border border-[#0E2538]/08 text-[#0E2538] rounded-bl-md shadow-[0_1px_3px_rgba(14,37,56,0.04)]'
                }`}
              >
                {human ? (
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.04em] opacity-70 mb-1">
                    Specialist
                  </span>
                ) : null}
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.body}</p>
              </div>
            </div>
          )
        })}
        {busy ? (
          <div className="flex justify-start" aria-live="polite" aria-label="Coach is typing">
            <div className="rounded-[1.15rem] rounded-bl-md bg-white border border-[#0E2538]/08 px-3.5 py-3 shadow-[0_1px_3px_rgba(14,37,56,0.04)]">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E2538]/35 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E2538]/35 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E2538]/35 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="text-center text-xs text-red-500 px-3 pb-1 flex-shrink-0">{error}</p> : null}

      {/* Composer dock */}
      <div className="flex-shrink-0 border-t border-[#0E2538]/06 bg-white/90 backdrop-blur-xl px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2">
        {!humanMode ? (
          <button
            type="button"
            onClick={onRequestHuman}
            disabled={busy}
            className="w-full text-xs font-medium text-[#0E2538]/55 flex items-center justify-center gap-1.5 py-1.5 rounded-lg active:scale-[0.98] transition-transform duration-100 disabled:opacity-50"
          >
            <UserRound className="w-3.5 h-3.5" />
            Talk to a specialist
          </button>
        ) : null}
        <div className="flex items-end gap-2 min-w-0">
          {speech.stt ? (
            <button
              type="button"
              onClick={toggleMic}
              disabled={busy}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-100 ease-out active:scale-[0.97] ${
                listening ? 'bg-red-500 text-white' : 'bg-[#F4FBFF] text-[#0E2538] border border-[#0E2538]/06'
              }`}
              aria-label={listening ? 'Stop listening' : 'Voice input'}
            >
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          ) : null}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={1}
            placeholder={listening ? 'Listening…' : 'Message Coach…'}
            className="min-w-0 flex-1 resize-none rounded-2xl bg-[#F4FBFF] border border-[#0E2538]/10 px-3.5 py-2.5 text-[15px] text-[#0E2538] focus:outline-none focus:ring-2 focus:ring-[#3F8DD2]/25 max-h-28"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void sendText(draft)
              }
            }}
          />
          <button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={() => void sendText(draft)}
            className="w-11 h-11 rounded-full bg-[#3F8DD2] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-transform duration-100 ease-out active:scale-[0.97]"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {currentSession?.current_day ? (
          <p className="text-[10px] text-center text-[#0E2538]/30 tracking-wide">
            Day {currentSession.current_day} · learns from your journey
          </p>
        ) : null}
      </div>
    </div>
  )
}
