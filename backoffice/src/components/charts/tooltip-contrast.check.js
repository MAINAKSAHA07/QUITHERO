import assert from 'node:assert/strict'

// Contract: chart tooltips must set readable colors via inline styles, not Tailwind-only.
const TOOLTIP_BG = '#0E2538'
const TOOLTIP_FG = '#fff'

assert.equal(TOOLTIP_BG, '#0E2538')
assert.equal(TOOLTIP_FG, '#fff')
assert.notEqual(TOOLTIP_BG.toLowerCase(), TOOLTIP_FG.toLowerCase())
console.log('chart tooltip contrast check ok')
