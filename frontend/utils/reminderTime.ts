/** Map KYC check-in window labels → default HH:MM (user-local). */
const PREFERENCE_TO_TIME: Record<string, string> = {
  'Morning: 8 AM to 10 AM': '09:00',
  'Lunchtime: 12 PM to 2 PM': '13:00',
  'Evening: 6 PM to 8 PM': '19:00',
  'Bedtime: 9 PM to 11 PM': '22:00',
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function preferenceToReminderTime(preference?: string): string {
  if (!preference) return '09:00'
  return PREFERENCE_TO_TIME[preference] ?? '09:00'
}

/** Match Home greeting buckets — hour is local 0–23. */
export function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Push title from reminder HH:MM (not wall-clock “now”, so catch-up stays honest). */
export function reminderNotificationTitle(timeHHMM: string): string {
  const h = parseInt(String(timeHHMM).split(':')[0], 10)
  if (!Number.isFinite(h)) return 'Your daily quote'
  const base = greetingForHour(h)
  return h < 12 ? `${base} ☀️` : base
}
