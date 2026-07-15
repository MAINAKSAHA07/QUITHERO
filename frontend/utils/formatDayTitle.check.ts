import assert from 'assert'
import { formatDayTitle } from './formatDayTitle.ts'

assert.equal(formatDayTitle('Day 1 — Seeing the Trap'), 'Day 1: Seeing the Trap')
assert.equal(formatDayTitle('Day 8 – Nothing to Give Up'), 'Day 8: Nothing to Give Up')
assert.equal(formatDayTitle('Day 1: Seeing the Trap'), 'Day 1: Seeing the Trap')

console.log('formatDayTitle.check OK')
