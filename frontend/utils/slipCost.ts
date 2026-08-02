import { LIFE_MINUTES_LOST_PER_CIGARETTE } from './onboardingCalculations'
import { calculateCostPerCigarette } from './onboardingCalculations'
import { formatMoney, getCountryConfig } from './currency'

/**
 * Cost of one cigarette for slip/savings display.
 * Prefer pack/20 when it looks sane for the country; else country default.
 * (Stops INR-style pack_cost 260–300 from showing as "$13"/cig on a US profile.)
 */
export function cigaretteUnitCost(opts: {
  packCost?: number | null
  country?: string | null
}): number {
  const fallback = getCountryConfig(opts.country || undefined).pricePerCigarette
  const fromPack = calculateCostPerCigarette(Number(opts.packCost) || 0)
  if (fromPack <= 0) return fallback
  if (fromPack > fallback * 4 || fromPack < fallback * 0.2) return fallback
  return fromPack
}

export function slipMoneyLost(
  cigaretteCount: number,
  opts: { packCost?: number | null; country?: string | null }
): number {
  return Math.max(0, cigaretteCount) * cigaretteUnitCost(opts)
}

export function formatSlipLoss(
  cigaretteCount: number,
  opts: { packCost?: number | null; country?: string | null }
): string {
  return formatMoney(slipMoneyLost(cigaretteCount, opts), opts.country || undefined)
}

/** Tentative nicotine absorbed from slips (mg). */
export function slipNicotineMg(
  cigaretteCount: number,
  country?: string | null
): number {
  const per = getCountryConfig(country || undefined).nicotinePerCigarette
  return Math.max(0, cigaretteCount) * per
}

export function formatSlipNicotine(
  cigaretteCount: number,
  country?: string | null
): string {
  const mg = Math.round(slipNicotineMg(cigaretteCount, country) * 10) / 10
  return `${mg}mg`
}

/** Educational guideline: ~11 life-minutes lost per cigarette. */
export function slipLifeMinutesLost(cigaretteCount: number): number {
  return Math.max(0, cigaretteCount) * LIFE_MINUTES_LOST_PER_CIGARETTE
}

export function formatSlipLifeLost(cigaretteCount: number): string {
  const mins = slipLifeMinutesLost(cigaretteCount)
  if (mins < 60) return `~${mins} min`
  const hours = Math.round((mins / 60) * 10) / 10
  return `~${hours} hr`
}

export function slipImpact(opts: {
  cigaretteCount: number
  packCost?: number | null
  country?: string | null
}) {
  const n = Math.max(0, opts.cigaretteCount)
  return {
    money: formatSlipLoss(n, opts),
    nicotine: formatSlipNicotine(n, opts.country),
    lifeLost: formatSlipLifeLost(n),
  }
}
