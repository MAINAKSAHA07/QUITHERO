/**
 * Voice helpers no-op safely when APIs missing.
 * Run: npx tsx frontend/utils/coachVoice.check.ts
 */
import assert from 'node:assert/strict'

function coachSpeechSupported(env: { SpeechRecognition?: unknown; speechSynthesis?: unknown }) {
  return {
    stt: !!env.SpeechRecognition,
    tts: !!env.speechSynthesis,
  }
}

assert.deepEqual(coachSpeechSupported({}), { stt: false, tts: false })
assert.deepEqual(coachSpeechSupported({ SpeechRecognition: {}, speechSynthesis: {} }), {
  stt: true,
  tts: true,
})

console.log('coachVoice.check: ok')
