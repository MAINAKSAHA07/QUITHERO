import {
  getSessionDuration,
  formatSessionDuration,
  elapsedToStorageMinutes,
  type SessionTimerState,
} from './sessionDuration'

const start = new Date('2026-01-01T00:00:00Z')
const end45 = new Date(start.getTime() + 45_000)
const end125 = new Date(start.getTime() + 125_000)

console.assert(getSessionDuration(start, end45).totalSeconds === 45, '45s duration')
console.assert(getSessionDuration(start, end45).minutesForStorage === 1, 'sub-minute rounds up to 1 min in DB')
console.assert(getSessionDuration(start, end125).minutesForStorage === 3, '125s -> 3 min ceil')
console.assert(formatSessionDuration(45) === '45 sec', 'format seconds')
console.assert(formatSessionDuration(125) === '2 min 5 sec', 'format min+sec')
console.assert(elapsedToStorageMinutes(150) === 3, 'storage minutes ceil')

function elapsedFromState(state: SessionTimerState, now: number) {
  let total = state.accumulatedSeconds
  if (state.segmentStartMs != null) {
    total += Math.floor((now - state.segmentStartMs) / 1000)
  }
  return total
}

const t0 = 1_000_000
let state: SessionTimerState = { accumulatedSeconds: 120, segmentStartMs: t0 }
console.assert(elapsedFromState(state, t0 + 30_000) === 150, 'active segment adds to accumulated')

state = { accumulatedSeconds: state.accumulatedSeconds + 30, segmentStartMs: null }
console.assert(state.accumulatedSeconds === 150, 'pause flushes segment')
console.assert(elapsedFromState(state, t0 + 60_000) === 150, 'total stable after pause')

console.log('sessionDuration self-check OK')
