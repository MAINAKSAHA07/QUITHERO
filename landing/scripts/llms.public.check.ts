import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const pub = path.join(dir, '../public')

const llms = fs.readFileSync(path.join(pub, 'llms.txt'), 'utf8')
const full = fs.readFileSync(path.join(pub, 'llms-full.txt'), 'utf8')
const robots = fs.readFileSync(path.join(pub, 'robots.txt'), 'utf8')

console.assert(llms.startsWith('# Smono\n'), 'llms.txt needs H1')
console.assert(llms.includes('> Smono is a personalised'), 'llms.txt needs summary blockquote')
console.assert(llms.includes('https://www.smono.app/how-it-works/'), 'llms.txt absolute URLs')
console.assert(llms.includes('/llms-full.txt'), 'llms.txt should link llms-full')
console.assert(full.startsWith('# Smono'), 'llms-full.txt needs H1')
console.assert(full.includes('Frequently asked questions'), 'llms-full.txt needs FAQ')
console.assert(robots.includes('Sitemap: https://www.smono.app/sitemap.xml'), 'robots sitemap')
console.assert(robots.includes('GPTBot'), 'robots allows GPTBot')
console.assert(robots.includes('llms.txt'), 'robots mentions llms.txt')
console.log('llms.public.check: ok')
