/**
 * ponytail: slip impact — money / nicotine / life minutes
 */
import assert from 'assert'
import {
  cigaretteUnitCost,
  formatSlipLifeLost,
  formatSlipLoss,
  formatSlipNicotine,
  slipImpact,
  slipLifeMinutesLost,
  slipMoneyLost,
  slipNicotineMg,
} from './slipCost.ts'

assert.equal(cigaretteUnitCost({ packCost: 400, country: 'IN' }), 20)
assert.equal(cigaretteUnitCost({ packCost: 0, country: 'IN' }), 12)
assert.equal(cigaretteUnitCost({ packCost: 260, country: 'US' }), 0.5)
assert.equal(cigaretteUnitCost({ packCost: 10.5, country: 'US' }), 0.525)
assert.equal(slipMoneyLost(1, { packCost: 260, country: 'US' }), 0.5)
assert.equal(formatSlipLoss(1, { packCost: 260, country: 'US' }), '$0.5')
assert.equal(slipNicotineMg(1, 'US'), 0.8)
assert.equal(formatSlipNicotine(1, 'US'), '0.8mg')
assert.equal(slipLifeMinutesLost(1), 11)
assert.equal(formatSlipLifeLost(1), '~11 min')
assert.equal(formatSlipLifeLost(6), '~1.1 hr')
const impact = slipImpact({ cigaretteCount: 1, packCost: 10, country: 'US' })
assert.equal(impact.nicotine, '0.8mg')
assert.equal(impact.lifeLost, '~11 min')

console.log('slipCost.check OK')
