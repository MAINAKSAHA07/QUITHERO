---
type: BehaviorSignal
title: Session Timing Patterns
description: When the user opens the app and completes sessions reveals their daily rhythm and optimal notification windows.
source: analytics_events (page_view), session_progress
---

# What We Observe

- Hour of day when app is opened (from page_view events)
- Day of week patterns (weekday vs weekend differences)
- Time between notification sent and session start
- Duration of sessions (rushed vs engaged)

# What It Tells Us

| Pattern | Interpretation |
|---------|---------------|
| Consistent morning opens (6–9 AM) | Routine-driven user, likely Auto-Pilot |
| Late night opens (10 PM–1 AM) | Possible Escapist (boredom/loneliness peaks at night) |
| Irregular, clustered opens | Stress-reactive pattern (opens when triggered) |
| Weekend drops | Social Mirror (busy socializing) or healthy balance |
| Gets faster over time | Growing confidence OR disengagement — check completion |

# How It Influences Personalization

1. **Notification timing**: Schedule the daily notification 30 min before their most common open time
2. **Content length**: Users who complete sessions in <5 min get shorter intro variants
3. **Session cadence**: If they always open at night, frame content as "evening wind-down" not "morning routine"
4. **Archetype signal**: Morning-routine openers lean Auto-Pilot; night openers lean Escapist
