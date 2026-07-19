/** CTA start path must be public — never /kyc. */
import { APP_START_PATH, appStartHref, appHref } from './appUrl'
import { APP_URL } from './seo.config'

console.assert(APP_START_PATH === '/language', `expected /language, got ${APP_START_PATH}`)
console.assert(!APP_START_PATH.includes('kyc'), 'start path must not be /kyc')
console.assert(appStartHref() === `${APP_URL}/language`, `got ${appStartHref()}`)
console.assert(appHref('/privacy') === `${APP_URL}/privacy` || typeof window !== 'undefined')
console.log('appUrl.check: ok')
