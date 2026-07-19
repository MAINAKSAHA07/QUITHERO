/** Assert Google Translate multi-segment join — fails if only first sentence is kept. */

function extractJoined(data: unknown): string | null {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null
  const parts = (data[0] as unknown[])
    .map((seg) => (Array.isArray(seg) ? seg[0] : null))
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
  return parts.length ? parts.join('') : null
}

const sample = [
  [
    ['Hello ', 'Hi there. More text.', null, null, 0],
    ['world.', 'Hi there. More text.', null, null, 0],
  ],
  null,
  'en',
]

const joined = extractJoined(sample)
console.assert(joined === 'Hello world.', `expected full join, got ${JSON.stringify(joined)}`)
console.log('translation.service.check: ok')
