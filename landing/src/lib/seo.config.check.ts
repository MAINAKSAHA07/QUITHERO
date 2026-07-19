import { OG_IMAGE, SITE_URL, canonicalPath, pageUrl } from './seo.config'

console.assert(OG_IMAGE === `${SITE_URL}/og-image.png`, OG_IMAGE)
console.assert(canonicalPath('/blog') === '/blog/', canonicalPath('/blog'))
console.assert(canonicalPath('/blog/') === '/blog/', canonicalPath('/blog/'))
console.assert(pageUrl('/privacy') === `${SITE_URL}/privacy/`, pageUrl('/privacy'))
console.assert(pageUrl('/') === `${SITE_URL}/`, pageUrl('/'))
console.log('seo.config.check: ok')
