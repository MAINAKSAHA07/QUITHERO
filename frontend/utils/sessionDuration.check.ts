import { getSessionDuration, formatSessionDuration } from './sessionDuration'

const start = new Date('2026-01-01T00:00:00Z')
const end45 = new Date(start.getTime() + 45_000)
const end125 = new Date(start.getTime() + 125_000)

console.assert(getSessionDuration(start, end45).totalSeconds === 45, '45s duration')
console.assert(getSessionDuration(start, end45).minutesForStorage === 1, 'sub-minute rounds up to 1 min in DB')
console.assert(getSessionDuration(start, end125).minutesForStorage === 3, '125s -> 3 min ceil')
console.assert(formatSessionDuration(45) === '45 sec', 'format seconds')
console.assert(formatSessionDuration(125) === '2 min 5 sec', 'format min+sec')
