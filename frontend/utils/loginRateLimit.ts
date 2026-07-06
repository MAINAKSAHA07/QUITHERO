const STORAGE_KEY = 'login_rate_limit_v1'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // ponytail: client-only; slows casual bots, not determined attackers

interface AttemptEntry {
  failures: number
  lockedUntil: number | null
}

type AttemptStore = Record<string, AttemptEntry>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function loadStore(): AttemptStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AttemptStore) : {}
  } catch {
    return {}
  }
}

function saveStore(store: AttemptStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getEntry(email: string): AttemptEntry {
  const store = loadStore()
  const key = normalizeEmail(email)
  const entry = store[key]
  if (!entry) return { failures: 0, lockedUntil: null }
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    delete store[key]
    saveStore(store)
    return { failures: 0, lockedUntil: null }
  }
  return entry
}

function setEntry(email: string, entry: AttemptEntry) {
  const store = loadStore()
  store[normalizeEmail(email)] = entry
  saveStore(store)
}

function clearEntry(email: string) {
  const store = loadStore()
  delete store[normalizeEmail(email)]
  saveStore(store)
}

export function getLoginLockout(email: string): {
  locked: boolean
  retryAfterMs: number
  failures: number
  attemptsRemaining: number
} {
  const entry = getEntry(email)
  const now = Date.now()
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      retryAfterMs: entry.lockedUntil - now,
      failures: entry.failures,
      attemptsRemaining: 0,
    }
  }
  return {
    locked: false,
    retryAfterMs: 0,
    failures: entry.failures,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - entry.failures),
  }
}

export function recordLoginFailure(email: string): {
  locked: boolean
  retryAfterMs: number
  attemptsRemaining: number
} {
  const entry = getEntry(email)
  const failures = entry.failures + 1
  if (failures >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS
    setEntry(email, { failures, lockedUntil })
    return { locked: true, retryAfterMs: LOCKOUT_MS, attemptsRemaining: 0 }
  }
  setEntry(email, { failures, lockedUntil: null })
  return {
    locked: false,
    retryAfterMs: 0,
    attemptsRemaining: MAX_ATTEMPTS - failures,
  }
}

export function recordLoginSuccess(email: string) {
  clearEntry(email)
}

/** Progressive delay after failed attempts to slow automated retries. */
export function getLoginRetryDelayMs(failures: number): number {
  return Math.min(3000, failures * 600)
}

export function formatLockoutDuration(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m <= 0) return `${s} sec`
  return s > 0 ? `${m} min ${s} sec` : `${m} min`
}

export const LOGIN_MAX_ATTEMPTS = MAX_ATTEMPTS
export const LOGIN_LOCKOUT_MINUTES = LOCKOUT_MS / 60_000
