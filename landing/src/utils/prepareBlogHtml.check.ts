import {
  isFullHtmlDocument,
  prepareBlogHtml,
  scopeCss,
  blogPlainText,
} from './prepareBlogHtml'

console.assert(isFullHtmlDocument('<!DOCTYPE html><html></html>'))
console.assert(isFullHtmlDocument('<html lang="en"><body>x</body></html>'))
console.assert(!isFullHtmlDocument('<p>Hello</p>'))

const scoped = scopeCss(':root{--x:1} .topbar{color:red} @media (max-width:600px){.topbar nav{display:none}}')
console.assert(scoped.includes('.blog-content{--x:1}'), scoped)
console.assert(scoped.includes('.blog-content .topbar{color:red}'), scoped)
console.assert(scoped.includes('@media (max-width:600px)'), scoped)
console.assert(scoped.includes('.blog-content .topbar nav{display:none}'), scoped)
console.assert(!scoped.includes('.blog-content @media'), scoped)

const full = `<!DOCTYPE html><html><head><style>.title{color:blue}</style></head><body>
<header class="topbar"><nav><a>How it works</a></nav><a class="cta">Begin Reset</a></header>
<main><article><h1 class="title">Why willpower fails</h1><p>Body copy.</p></article></main>
<footer><a>Home</a></footer>
</body></html>`

const prepared = prepareBlogHtml(full)
console.assert(!prepared.includes('How it works'), 'stripped topbar')
console.assert(!prepared.includes('Begin Reset'), 'stripped CTA chrome')
console.assert(prepared.includes('Why willpower fails'), prepared)
console.assert(prepared.includes('.blog-content .title'), prepared)
console.assert(!/<script/i.test(prepareBlogHtml('<p>x</p><script>alert(1)</script>')))

const plain = blogPlainText(full)
console.assert(plain.includes('Why willpower fails'))
console.assert(!plain.includes('How it works'))
console.assert(!plain.includes('color:blue'))

console.log('prepareBlogHtml.check: ok')
