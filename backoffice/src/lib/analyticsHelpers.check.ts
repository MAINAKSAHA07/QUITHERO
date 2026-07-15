import {
  cohortRetentionPct,
  retentionCurvePoints,
  signupMonthCohorts,
  distinctUsers,
  localDayKey,
  recordInRange,
  activitySinceDate,
} from './analyticsHelpers.ts'

const users = [
  { id: 'a', created: '2026-01-01T00:00:00' },
  { id: 'b', created: '2026-01-01T00:00:00' },
]
const activity = new Map<string, number>([
  ['a', new Date('2026-01-15T00:00:00').getTime()],
])

console.assert(cohortRetentionPct(users, activity, 7) === 50, 'cohort day7 = 50%')
console.assert(distinctUsers([{ user: 'x' }, { user: 'x' }, { user: 'y' }]).size === 2, 'distinct')
console.assert(localDayKey('2026-07-14T03:00:00').length === 10, 'local day key')
console.assert(recordInRange('2026-07-10', activitySinceDate('all')) === true, 'all range')
const curve = retentionCurvePoints(users, activity, 14, 7)
console.assert(curve.length >= 2 && curve[0].days === 0, 'retention curve starts at 0')

const months = signupMonthCohorts(
  [
    { id: 'a', created: new Date().toISOString() },
    { id: 'b', created: '2020-01-15T00:00:00' },
  ],
  new Map([['b', Date.now()]]),
  1
)
console.assert(months.length === 1 && typeof months[0].d7 === 'number', 'signup month cohorts')

console.log('analyticsHelpers.check.ts: ok')
