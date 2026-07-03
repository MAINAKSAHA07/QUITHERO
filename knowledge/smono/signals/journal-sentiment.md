---
type: BehaviorSignal
title: Journal Sentiment
description: Mood trajectory from journal entries reveals emotional state and risk of disengagement or relapse.
source: journal_entries collection (mood field)
---

# What We Observe

- Mood values over time (very_happy → very_sad scale)
- Frequency of journal entries (engagement indicator)
- Mood trajectory direction (improving/stable/declining)
- Correlation between mood dips and craving spikes

# What It Tells Us

| Pattern | Interpretation |
|---------|---------------|
| Improving mood trend | Program is working — positive reinforcement appropriate |
| Declining mood after Day 10 | Withdrawal emotional impact — needs extra support |
| No journal entries for 3+ days | Disengagement risk — re-engagement notification needed |
| Mood consistently neutral | Possible emotional avoidance — Escapist signal |
| Wild swings (very_happy ↔ very_sad) | Emotional instability — tread carefully with content tone |

# How It Influences Personalization

1. **Declining mood → tone shift**: Move from challenging content to supportive/validating tone
2. **No entries → re-engagement**: "Quick mood check?" notification (low effort ask)
3. **Improving trend → reinforcement**: "Your mood is trending up — notice that" in session intro
4. **Pre-quit anxiety (Days 8–9)**: Expected mood dip — normalize in content ("Feeling nervous is your brain preparing")
5. **Post-quit dip (Days 11–14)**: Expected — content should acknowledge difficulty without catastrophizing
