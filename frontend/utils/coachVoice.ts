/**
 * Web Speech STT/TTS — no-ops when unsupported.
 */

const TTS_MUTE_KEY = 'smono_coach_tts_mute'

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((ev: any) => void) | null
  onerror: ((ev: any) => void) | null
  onend: (() => void) | null
}

function RecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function coachSpeechSupported(): { stt: boolean; tts: boolean } {
  return {
    stt: typeof window !== 'undefined' && !!RecognitionCtor(),
    tts: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}

export function isCoachTtsMuted(): boolean {
  try {
    return localStorage.getItem(TTS_MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setCoachTtsMuted(muted: boolean) {
  try {
    localStorage.setItem(TTS_MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function speakCoachText(text: string, lang = 'en') {
  if (!text?.trim() || isCoachTtsMuted()) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.slice(0, 600))
  u.lang = lang || 'en'
  window.speechSynthesis.speak(u)
}

/** Start listening; resolve with final transcript or reject. */
export function startCoachListening(lang = 'en'): {
  stop: () => void
  done: Promise<string>
} {
  const Ctor = RecognitionCtor()
  if (!Ctor) {
    return {
      stop: () => {},
      done: Promise.reject(new Error('Speech recognition not supported')),
    }
  }

  const rec = new Ctor()
  rec.lang = lang || 'en-US'
  rec.continuous = false
  rec.interimResults = true

  let settled = false
  let transcript = ''

  const done = new Promise<string>((resolve, reject) => {
    rec.onresult = (ev: any) => {
      let text = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        text += ev.results[i][0]?.transcript || ''
        if (ev.results[i].isFinal) transcript = text
      }
      if (!transcript) transcript = text
    }
    rec.onerror = (ev: any) => {
      if (settled) return
      settled = true
      reject(new Error(ev?.error || 'speech_error'))
    }
    rec.onend = () => {
      if (settled) return
      settled = true
      resolve(transcript.trim())
    }
    try {
      rec.start()
    } catch (e: any) {
      settled = true
      reject(e)
    }
  })

  return {
    stop: () => {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    },
    done,
  }
}
