/** Spike = intensity 5+ or ≥2 cravings logged in a 2h window (incl. current). */
export function shouldTriggerCravingSpike(intensity: number, recentInWindowInclCurrent: number): boolean {
  return intensity >= 5 || recentInWindowInclCurrent >= 2
}
