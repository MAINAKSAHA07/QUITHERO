/**
 * Auth users can't patch email without manage access (PB Equal(original.email)).
 * Omit email from the update; caller uses requestEmailChange when it changed.
 */
export function buildSelfUserPatch(name: string): Record<string, string> {
  return { name: name.trim() }
}

export function emailChangeRequested(current: string, next: string): string | null {
  const a = current.trim()
  const b = next.trim()
  if (!b || b === a) return null
  return b
}
