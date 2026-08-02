/**
 * ponytail: related picks must give each post a sibling link for crawl equity
 */
import assert from 'node:assert/strict'
import { pickRelatedBlogPosts } from './relatedBlogPosts.ts'
import type { BlogPost } from '../types/blog.ts'

const posts = [
  { id: '1', slug: 'a', title: 'A', published_at: '2026-01-01' },
  { id: '2', slug: 'b', title: 'B', published_at: '2026-02-01' },
  { id: '3', slug: 'c', title: 'C', published_at: '2026-03-01' },
] as BlogPost[]

const mid = pickRelatedBlogPosts(posts[1], posts, 2)
assert.equal(mid.length, 2)
assert.deepEqual(
  mid.map((p) => p.id).sort(),
  ['1', '3']
)

const first = pickRelatedBlogPosts(posts[0], posts, 2)
assert.equal(first.some((p) => p.id === '2'), true)
assert.equal(first.length, 2)

const alone = pickRelatedBlogPosts(posts[0], [posts[0]], 2)
assert.equal(alone.length, 0)

// Every post is linked from at least one other (via reciprocal neighbors)
const inbound = new Map(posts.map((p) => [p.id, 0]))
for (const p of posts) {
  for (const r of pickRelatedBlogPosts(p, posts, 2)) {
    inbound.set(r.id, (inbound.get(r.id) || 0) + 1)
  }
}
for (const p of posts) {
  assert.ok((inbound.get(p.id) || 0) >= 1, `${p.id} needs ≥1 sibling inbound`)
}

console.log('relatedBlogPosts.check OK')
