---
type: BehaviorSignal
title: Craving Patterns
description: Craving frequency, intensity, timing, and triggers reveal the user's real relationship with nicotine.
source: cravings collection
---

# What We Observe

- Craving count per day
- Time-of-day distribution
- Dominant trigger type (stress, boredom, social, habit)
- Intensity trajectory (rising/stable/falling over 5 days)
- Clustering (multiple cravings within 2-hour windows)
- Slip events (type: 'slip') vs resisted cravings

# What It Tells Us

| Pattern | Interpretation |
|---------|---------------|
| High count (>5/day), low intensity (1–2) | Auto-Pilot — many habitual urges, none overwhelming |
| Low count (<3/day), high intensity (4–5) | Stress Reactor — fewer but more powerful episodes |
| Clusters at social hours (evening/weekend) | Social Mirror — triggered by context |
| Evening/night clusters with BOREDOM trigger | Escapist — filling time voids |
| Falling intensity over 5 days | Good prognosis — withdrawal weakening |
| Rising intensity after Day 3 | May need intervention — check for stressors |

# How It Influences Personalization

1. **Craving peak hour → notification timing**: Send grounding message 30 min before peak
2. **Dominant trigger → archetype confirmation/revision**: If behavioral trigger ≠ onboarding trigger, flag for revision
3. **Intensity trend → content urgency**: Rising intensity triggers escalation notifications
4. **Slip events → immediate response**: Trigger slip-recovery notification within 1 hour
5. **Cluster detection → real-time support**: ≥2 cravings in 2 hours → send immediate craving-support notification

# Escalation Thresholds

- **Yellow**: Intensity trend rising for 2+ consecutive days
- **Orange**: ≥3 cravings in 2 hours OR intensity 5 logged
- **Red**: Slip event logged — activate slip recovery protocol (Day 25 content fast-tracked)
