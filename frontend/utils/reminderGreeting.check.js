import assert from 'node:assert/strict'

// Keep buckets in sync with reminderTime.ts + scripts/reminder-scheduler.js
function greetingForHour(h) {
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function reminderNotificationTitle(timeHHMM) {
  const h = parseInt(String(timeHHMM).split(':')[0], 10)
  if (!Number.isFinite(h)) return 'Your daily quote'
  const base = greetingForHour(h)
  return h < 12 ? `${base} ☀️` : base
}

assert.equal(reminderNotificationTitle('09:00'), 'Good morning ☀️')
assert.equal(reminderNotificationTitle('13:00'), 'Good afternoon')
assert.equal(reminderNotificationTitle('17:06'), 'Good evening')
assert.equal(reminderNotificationTitle('22:00'), 'Good evening')
assert.equal(reminderNotificationTitle('bad'), 'Your daily quote')
console.log('reminder greeting check ok')
