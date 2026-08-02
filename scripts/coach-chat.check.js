/**
 * Coach gates + reply shape + learning context headers + dash cleanup.
 * Run: node scripts/coach-chat.check.js
 */
import assert from 'node:assert/strict'

function coachContextHasSections(text) {
  return (
    /KYC/i.test(text) &&
    /JOURNAL/i.test(text) &&
    (/USER INPUT HISTORY/i.test(text) || /SESSION/i.test(text) || /reflection/i.test(text))
  )
}

function cleanCoachReply(text) {
  return String(text || '')
    .replace(/\u2014|\u2013/g, ', ')
    .replace(/\s*--+\s*/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseCoachReply(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    parsed = m ? JSON.parse(m[0]) : {}
  }
  if (!parsed.reply) parsed.reply = "I'm here with you."
  parsed.reply = cleanCoachReply(parsed.reply)
  return {
    reply: String(parsed.reply),
    suggest_specialist: !!parsed.suggest_specialist,
    mood_signal: parsed.mood_signal,
  }
}

function gateCoachAi({ enabled, mode, callerKind, callerId, userId }) {
  if (callerKind !== 'user' || callerId !== userId) return { status: 401, error: 'User login required' }
  if (!enabled) return { status: 403, error: 'Coach not enabled for this account' }
  if (mode === 'human') return { status: 409, error: 'Specialist connected' }
  return null
}

assert.equal(
  gateCoachAi({ enabled: false, mode: 'ai', callerKind: 'user', callerId: 'u1', userId: 'u1' })?.status,
  403
)
assert.equal(
  gateCoachAi({ enabled: true, mode: 'ai', callerKind: 'user', callerId: 'u1', userId: 'u1' }),
  null
)

const sampleCtx = `KYC / ONBOARDING\nx\n\nJOURNAL (recent):\n- day\n\nUSER INPUT HISTORY (reflections):\n- Day 1`
assert.equal(coachContextHasSections(sampleCtx), true)

assert.equal(cleanCoachReply('I hear you—sadness is real -- take a breath.'), 'I hear you, sadness is real, take a breath.')
assert.ok(!cleanCoachReply('a — b -- c').includes('--'))
assert.ok(!cleanCoachReply('a — b -- c').includes('\u2014'))

const reply = parseCoachReply('{"reply":"Hang in there -- you got this.","suggest_specialist":true}')
assert.equal(reply.suggest_specialist, true)
assert.ok(!reply.reply.includes('--'))

console.log('coach-chat.check: ok')
