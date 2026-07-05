/**
 * Safe, educational calculators for nicotine consumption.
 * Built on behavioral metrics to help users visualize impact.
 */

export const MINUTES_PER_CIGARETTE = 7;
export const LIFE_MINUTES_LOST_PER_CIGARETTE = 11;

/**
 * Calculates price of a single cigarette based on pack price of 20
 */
export function calculateCostPerCigarette(packCost: number): number {
  if (!packCost || packCost <= 0) return 0;
  return packCost / 20;
}

/**
 * Calculates estimate of total cigarettes smoked over usage period
 */
export function calculateLifetimeCigarettes(dailyConsumption: number, monthsUsing: number): number {
  if (!dailyConsumption || !monthsUsing || dailyConsumption < 0 || monthsUsing < 0) return 0;
  const totalDays = monthsUsing * 30; // standard 30 days per month
  return dailyConsumption * totalDays;
}

/**
 * Calculates estimate of money spent over nicotine usage period
 */
export function calculateLifetimeSpend(dailyConsumption: number, monthsUsing: number, packCost: number): number {
  const totalCigs = calculateLifetimeCigarettes(dailyConsumption, monthsUsing);
  const costPerCig = calculateCostPerCigarette(packCost);
  return totalCigs * costPerCig;
}

/**
 * Calculates monthly expenditure on nicotine
 */
export function calculateMonthlySpend(dailyConsumption: number, packCost: number): number {
  if (!dailyConsumption || !packCost || dailyConsumption < 0 || packCost < 0) return 0;
  const costPerCig = calculateCostPerCigarette(packCost);
  return dailyConsumption * 30 * costPerCig;
}

/**
 * Calculates yearly expenditure on nicotine
 */
export function calculateYearlySpend(dailyConsumption: number, packCost: number): number {
  if (!dailyConsumption || !packCost || dailyConsumption < 0 || packCost < 0) return 0;
  const costPerCig = calculateCostPerCigarette(packCost);
  return dailyConsumption * 365 * costPerCig;
}

/**
 * Calculates active time spent smoking in minutes
 */
export function calculateActiveTimeSpent(
  dailyConsumption: number,
  monthsUsing: number,
  minutesPerCigarette: number
): number {
  const totalCigs = calculateLifetimeCigarettes(dailyConsumption, monthsUsing);
  const activeMinutes = minutesPerCigarette || MINUTES_PER_CIGARETTE;
  return totalCigs * activeMinutes;
}

/**
 * Calculates estimate of cigarettes avoided in a single year of quitting
 */
export function calculateCigarettesAvoidedYear(dailyConsumption: number): number {
  if (!dailyConsumption || dailyConsumption < 0) return 0;
  return dailyConsumption * 365;
}

/**
 * Calculates estimated life expectancy minutes lost (educational guideline)
 */
export function calculateLifeMinutesLost(dailyConsumption: number, monthsUsing: number): number {
  const totalCigs = calculateLifetimeCigarettes(dailyConsumption, monthsUsing);
  return totalCigs * LIFE_MINUTES_LOST_PER_CIGARETTE;
}
