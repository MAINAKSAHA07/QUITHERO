/** Human-like pause before showing a coach reply (ms). */
export function coachTypingDelayMs(reply: string): number {
  const len = String(reply || '').length
  // ~read/think + ~35ms per character, clamped so it feels human not stuck
  return Math.min(4500, Math.max(900, 700 + len * 35))
}

export function cleanCoachReplyClient(text: string): string {
  let out = text
    .replace(/\u2014|\u2013/g, ', ')
    .replace(/\s*--+\s*/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const words = out.split(/\s+/).filter(Boolean)
  if (words.length > 55) out = `${words.slice(0, 55).join(' ')}…`
  return out
}
