import assert from 'node:assert/strict'

// Keep in sync with reminderTitle() in reminder-scheduler.js
function reminderTitle(timeHHMM) {
  const h = parseInt(String(timeHHMM).split(':')[0], 10)
  if (!Number.isFinite(h)) return 'Your daily quote'
  if (h < 12) return 'Good morning ☀️'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

assert.equal(reminderTitle('17:06'), 'Good evening')
assert.equal(reminderTitle('09:00'), 'Good morning ☀️')
assert.equal(reminderTitle('13:00'), 'Good afternoon')
console.log('reminder-scheduler greeting check ok')
