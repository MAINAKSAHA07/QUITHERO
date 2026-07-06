export function getSessionDuration(start: Date, end: Date = new Date()) {
  const totalSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
  const minutesForStorage = Math.max(1, Math.ceil(totalSeconds / 60))
  return { totalSeconds, minutesForStorage }
}

export function formatSessionDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} sec`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m < 60) return s > 0 ? `${m} min ${s} sec` : `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h} hr ${rm} min` : `${h} hr`
}

export function sessionTimerKey(dayId: string) {
  return `session_timer_${dayId}`
}
