/**
 * Map React Router pathname → stable analytics page key.
 * Keep keys short and stable — backoffice funnels depend on them.
 */
export function analyticsPageFromPath(pathname: string): string {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'
  if (p === '/' || p === '') return 'root'
  if (p === '/home') return 'home'
  if (p === '/sessions') return 'sessions'
  if (p.startsWith('/sessions/') || p.startsWith('/session/')) return 'session'
  if (p === '/craving') return 'craving'
  if (p === '/breathing') return 'breathing'
  if (p === '/progress') return 'progress'
  if (p === '/journal') return 'journal'
  if (p === '/profile') return 'profile'
  if (p === '/coach') return 'coach'
  if (p === '/paywall') return 'paywall'
  if (p === '/kyc') return 'kyc'
  if (p === '/login') return 'login'
  if (p === '/signup') return 'signup'
  if (p === '/onboarding') return 'onboarding'
  if (p === '/language') return 'language'
  if (p === '/forgot-password') return 'forgot_password'
  if (p === '/confirm-password-reset') return 'confirm_password_reset'
  if (p === '/claim-payment') return 'claim_payment'
  if (p === '/claim-gift') return 'claim_gift'
  if (p === '/objection-survey') return 'objection_survey'
  if (p.startsWith('/objection/')) return 'objection'
  if (p === '/subscription-confirmed') return 'subscription_confirmed'
  // Unknown routes still get a slug so we can spot dead links in admin.
  return p.replace(/^\//, '').replace(/\//g, '_') || 'unknown'
}
