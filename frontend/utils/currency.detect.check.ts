import { COUNTRIES, DEFAULT_COUNTRY, detectCountryCode } from './currency'

console.assert(COUNTRIES.IN?.currency === 'INR')
console.assert(DEFAULT_COUNTRY === 'IN')
// Network may fail in CI — function must still resolve a known code
const code = await detectCountryCode()
console.assert(Boolean(COUNTRIES[code]), code)
console.log('currency.detect.check: ok', code)
