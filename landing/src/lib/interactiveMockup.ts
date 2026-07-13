import type { CountryConfig } from './pricing'
import { formatMoney } from './pricing'

/** Wire the showcase progress mockup sliders + labels. */
export function initInteractiveMockup(
  config: CountryConfig,
  moneyFn: typeof formatMoney = formatMoney
): () => void {
  const days = document.getElementById('mockupDays') as HTMLInputElement | null
  const cigs = document.getElementById('mockupCigsPerDay') as HTMLInputElement | null
  const daysLabel = document.getElementById('mockupDaysLabel')
  const cigsLabel = document.getElementById('mockupCigsLabel')
  const daysNum = document.getElementById('mockupDaysNum')
  const cigsTotal = document.getElementById('mockupCigsTotal')
  const money = document.getElementById('mockupMoneySaved')
  const addDay = document.getElementById('mockupAddDay')
  if (!days || !cigs) return () => {}

  const update = () => {
    const d = Number(days.value)
    const c = Number(cigs.value)
    const total = d * c
    if (daysLabel) daysLabel.textContent = String(d)
    if (cigsLabel) cigsLabel.textContent = String(c)
    if (daysNum) daysNum.textContent = String(d)
    if (cigsTotal) cigsTotal.textContent = String(total)
    if (money) money.textContent = moneyFn(total * config.pricePerCigarette, config)
  }

  const onAdd = () => {
    days.value = String(Math.min(30, Number(days.value) + 1))
    update()
  }

  days.addEventListener('input', update)
  cigs.addEventListener('input', update)
  addDay?.addEventListener('click', onAdd)
  update()

  return () => {
    days.removeEventListener('input', update)
    cigs.removeEventListener('input', update)
    addDay?.removeEventListener('click', onAdd)
  }
}
