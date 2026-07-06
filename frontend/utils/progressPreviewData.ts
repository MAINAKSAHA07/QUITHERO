import type { ChartPoint, TriggerSlice } from '../components/progress/ProgressCharts'
import { CravingTrigger } from '../types/enums'

const TRIGGER_COLORS: Record<string, string> = {
  [CravingTrigger.STRESS]: '#F58634',
  [CravingTrigger.SOCIAL]: '#D45A1C',
  [CravingTrigger.BOREDOM]: '#FFD08A',
  [CravingTrigger.HABIT]: '#2A72B5',
  [CravingTrigger.OTHER]: '#9B59B6',
}

/** ponytail: static demo data — shown only when user has zero craving logs */
export const PREVIEW_CRAVING_TREND_WEEK: ChartPoint[] = [
  { day: 'Mon', cravings: 4 },
  { day: 'Tue', cravings: 3 },
  { day: 'Wed', cravings: 5 },
  { day: 'Thu', cravings: 2 },
  { day: 'Fri', cravings: 3 },
  { day: 'Sat', cravings: 2 },
  { day: 'Sun', cravings: 1 },
]

export const PREVIEW_TRIGGER_BREAKDOWN: TriggerSlice[] = [
  { name: 'Stress', value: 38, color: TRIGGER_COLORS[CravingTrigger.STRESS] },
  { name: 'Habit', value: 28, color: TRIGGER_COLORS[CravingTrigger.HABIT] },
  { name: 'Boredom', value: 20, color: TRIGGER_COLORS[CravingTrigger.BOREDOM] },
  { name: 'Social', value: 14, color: TRIGGER_COLORS[CravingTrigger.SOCIAL] },
]
