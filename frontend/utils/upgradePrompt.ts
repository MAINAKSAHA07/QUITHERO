/** Free users who finished Day 1 need Day 2+ unlock. Paid users never. */
export function needsDay2Upgrade(isPremium: boolean, currentDay: number | null | undefined): boolean {
  if (isPremium) return false
  const day = Math.max(1, Math.floor(Number(currentDay) || 1))
  return day > 1
}
