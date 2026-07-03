---
type: CBTConcept
title: CBT Technique Effectiveness
description: Per-archetype technique response data and content routing rules for the AI personalization engine.
tags: [cbt, technique-effectiveness, personalization]
timestamp: 2026-07-03T00:00:00Z
---

# Technique Types Used in the 30-Day Program

| Technique | Description | Days Used |
|-----------|-------------|-----------|
| psychoeducation | Knowledge delivery about addiction mechanisms | 1, 2, 5, 6 |
| functional_analysis | Identifying A→B→C patterns in own behavior | 3, 4, 12, 13 |
| cognitive_restructuring | Directly challenging irrational beliefs | 7, 8, 14, 15 |
| behavioral_activation | Replacing smoking with alternative behaviors | 9, 10, 11, 18 |
| relapse_prevention | Building skills for high-risk situations | 23, 24, 25, 26 |
| values_clarification | Connecting quit to personal meaning | 22, 29, 30 |
| mindfulness | Present-moment awareness and urge surfing | 16, 17, 19 |
| positive_reinforcement | Celebrating progress and gains | 20, 21, 28 |

# Expected Response by Archetype

## Stress Reactor
- **Best responding**: mindfulness (-1.8 avg intensity delta), functional_analysis (-1.2)
- **Moderate**: psychoeducation (-0.8), cognitive_restructuring (-0.6)
- **Lowest**: behavioral_activation (-0.3)
- **Routing**: Prioritize breathwork-adjacent and awareness techniques; avoid pure distraction

## Escapist
- **Best responding**: behavioral_activation (-1.5), values_clarification (-1.3)
- **Moderate**: cognitive_restructuring (-0.9), positive_reinforcement (-0.8)
- **Lowest**: psychoeducation (-0.2)
- **Routing**: Give them something to DO; pure knowledge delivery doesn't land

## Social Mirror
- **Best responding**: cognitive_restructuring (-1.6), relapse_prevention (-1.4)
- **Moderate**: values_clarification (-1.0), functional_analysis (-0.7)
- **Lowest**: mindfulness (-0.3)
- **Routing**: Identity and social scenarios work best; solo introspection least effective

## Auto-Pilot
- **Best responding**: behavioral_activation (-1.7), functional_analysis (-1.5)
- **Moderate**: relapse_prevention (-1.0), mindfulness (-0.8)
- **Lowest**: values_clarification (-0.2)
- **Routing**: Pattern disruption and awareness of unconscious habits; abstract meaning doesn't connect

# AI Routing Rules

1. If `technique_worked = true` for > 2 sessions of the same technique → increase future dosage
2. If `intensity_delta > 0` (technique made things worse) → flag for review, adjust approach
3. If engagement_quality = "surface" for a technique → try a different framing next time
4. After Day 10, the AI has enough data to predict technique effectiveness per user
5. Cross-reference with active beliefs: if belief_relaxation > 7, prioritize functional_analysis for that belief

# Computing technique_worked

```
technique_worked = intensity_delta < -0.5
```

Where:
- intensity_delta = avg_intensity_after - avg_intensity_before
- "before" = 48h window preceding session start
- "after" = 48h window following session completion
- Minimum 2 cravings in "before" window required for valid measurement
