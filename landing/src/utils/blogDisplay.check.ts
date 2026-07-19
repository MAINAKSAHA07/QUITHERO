/**
 * Runnable: npx tsx landing/src/utils/blogDisplay.check.ts
 */
import { displayBlogTitle, displayBlogType } from './blogDisplay'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(
  displayBlogTitle('Best Quit Smoking App | Smono') === 'Best Quit Smoking App',
  'strip | Smono'
)
assert(
  displayBlogTitle('Why Willpower Fails | Smono Blog') === 'Why Willpower Fails',
  'strip | Smono Blog'
)
assert(displayBlogType('blog') === 'Article', 'blog→Article')
assert(displayBlogType('guide') === 'Guide', 'guide')

console.log('blogDisplay.check: ok')
