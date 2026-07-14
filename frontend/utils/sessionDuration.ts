export function getSessionDuration(start: Date, end: Date = new Date()) {
  const totalSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
  const minutesForStorage = Math.max(1, Math.ceil(totalSeconds / 60))
  return { totalSeconds, minutesForStorage }
}

export function formatSessionDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} sec`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m < 60) return s > 0 ? `${m} min ${s} sec` : `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h} hr ${rm} min` : `${h} hr`
}

export function sessionTimerKey(dayId: string) {
  return `session_timer_${dayId}`
}

function sessionActiveKey(dayId: string) {
  return `session_active_${dayId}`
}

export type SessionTimerState = {
  accumulatedSeconds: number
  segmentStartMs: number | null
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
    sessionStorage.setItem(key, value)
  } catch {
    /* ponytail: private mode / quota — best effort */
  }
}

function removeRaw(key: string) {
  try {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function readSessionTimer(dayId: string): SessionTimerState {
  try {
    const raw = readRaw(sessionActiveKey(dayId))
    if (raw) {
      const parsed = JSON.parse(raw) as SessionTimerState
      return {
        accumulatedSeconds: Math.max(0, Number(parsed.accumulatedSeconds) || 0),
        segmentStartMs:
          parsed.segmentStartMs != null && !Number.isNaN(Number(parsed.segmentStartMs))
            ? Number(parsed.segmentStartMs)
            : null,
      }
    }

    const legacy = readRaw(sessionTimerKey(dayId))
    if (legacy) {
      const ms = Number(legacy)
      if (!Number.isNaN(ms)) {
        return { accumulatedSeconds: 0, segmentStartMs: ms }
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { accumulatedSeconds: 0, segmentStartMs: null }
}

export function writeSessionTimer(dayId: string, state: SessionTimerState) {
  writeRaw(sessionActiveKey(dayId), JSON.stringify(state))
}

export function clearSessionTimer(dayId: string) {
  removeRaw(sessionActiveKey(dayId))
  removeRaw(sessionTimerKey(dayId))
}

/** Start or resume the active segment (call on session open / tab visible). */
export function startSessionSegment(dayId: string): SessionTimerState {
  const state = readSessionTimer(dayId)
  if (state.segmentStartMs == null) {
    state.segmentStartMs = Date.now()
    writeSessionTimer(dayId, state)
  }
  return state
}

/** Flush the running segment into accumulated time (call on hide / leave). */
export function pauseSessionSegment(dayId: string): SessionTimerState {
  const state = readSessionTimer(dayId)
  if (state.segmentStartMs != null) {
    const elapsed = Math.floor((Date.now() - state.segmentStartMs) / 1000)
    state.accumulatedSeconds += Math.max(0, elapsed)
    state.segmentStartMs = null
    writeSessionTimer(dayId, state)
  }
  return state
}

export function getSessionElapsedSeconds(dayId: string, now = Date.now()): number {
  const state = readSessionTimer(dayId)
  let total = state.accumulatedSeconds
  if (state.segmentStartMs != null) {
    total += Math.floor((now - state.segmentStartMs) / 1000)
  }
  return Math.max(0, total)
}

export function elapsedToStorageMinutes(totalSeconds: number): number {
  return Math.max(1, Math.ceil(totalSeconds / 60))
}
