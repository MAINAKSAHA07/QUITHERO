import { buildCravingTrend, localDayKey } from './cravingTrend'

const now = new Date('2026-07-24T12:00:00') // local noon Friday

// No data → empty (UI shows sample preview, not an all-zero chart).
console.assert(buildCravingTrend([], 7, now).length === 0, 'empty when no records')

// Slips are excluded from the craving trend.
const slipsOnly = buildCravingTrend([{ created: '2026-07-24T10:00:00', type: 'slip' }], 7, now)
console.assert(slipsOnly.length === 0, 'slips do not count as cravings')

// Week window is continuous: exactly 7 days ending today, zeros filled.
const week = buildCravingTrend(
  [
    { created: '2026-07-24T09:00:00', type: 'craving' },
    { created: '2026-07-24T20:00:00', type: 'craving' },
    { created: '2026-07-22T08:00:00', type: 'craving' },
  ],
  7,
  now
)
console.assert(week.length === 7, `week has 7 points, got ${week.length}`)
console.assert(week[week.length - 1].date === localDayKey(now), 'last point is today')
console.assert(week[week.length - 1].count === 2, 'today counts both cravings')
console.assert(week[4].date === '2026-07-22' && week[4].count === 1, 'mid-week day counted')
console.assert(week[5].count === 0, 'gap day filled with zero')

// A record older than the window is dropped.
const outside = buildCravingTrend([{ created: '2026-07-01T09:00:00', type: 'craving' }], 7, now)
console.assert(outside.length === 0, 'records outside window excluded')

console.log('cravingTrend.check.ts: ok')
