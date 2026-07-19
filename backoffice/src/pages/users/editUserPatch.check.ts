/**
 * ponytail: empty email in auth update must be omitted — PB returns
 * "Failed to update record." / validation_values_mismatch otherwise.
 */
function buildUserPatch(name: string, email: string): Record<string, string> {
  const userPatch: Record<string, string> = { name: name.trim() }
  if (email.trim()) userPatch.email = email.trim()
  return userPatch
}

const withEmail = buildUserPatch('Ada', 'ada@example.com')
console.assert(withEmail.email === 'ada@example.com' && withEmail.name === 'Ada')

const blankEmail = buildUserPatch('Ada', '  ')
console.assert(!('email' in blankEmail) && blankEmail.name === 'Ada')

console.log('editUserPatch.check: ok')
