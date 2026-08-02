/**
 * Auth users can't patch email without manage access (PB Equal(original.email)
 * → validation_values_mismatch). Admins omit blank email; include emailConfirm
 * when email is sent so client/API previews that need it also pass.
 */
function buildUserPatch(name: string, email: string): Record<string, string> {
  const userPatch: Record<string, string> = { name: name.trim() }
  const next = email.trim()
  if (next) {
    userPatch.email = next
    userPatch.emailConfirm = next
  }
  return userPatch
}

const withEmail = buildUserPatch('Ada', 'ada@example.com')
console.assert(withEmail.email === 'ada@example.com' && withEmail.emailConfirm === 'ada@example.com' && withEmail.name === 'Ada')

const blankEmail = buildUserPatch('Ada', '  ')
console.assert(!('email' in blankEmail) && blankEmail.name === 'Ada')

console.log('editUserPatch.check: ok')
