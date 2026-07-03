---
type: NotificationIndex
description: Notification intelligence system — timing, message library, and escalation rules.
---

# Notification Intelligence

The notification system has 4 trigger types, each with archetype-specific messaging. The AI selects the best message based on the user's behavioral profile and current context.

## Trigger Types

| Type | When Fired | Priority |
|------|-----------|----------|
| `scheduled` | Best hour from behavior profile (daily) | Normal |
| `craving_spike` | ≥2 cravings in 2 hours OR intensity 5 | High |
| `missed_session` | Session not opened by user's typical time + 4 hours | Medium |
| `slip` | User logs a craving with type 'slip' | Critical |

## Message Constraints

- **Title**: Max 60 characters
- **Body**: Max 120 characters
- **Frequency cap**: Max 3 notifications per day (across all types)
- **Cool-down**: Min 2 hours between notifications (except slip — immediate)
- **Night silence**: No notifications between 11 PM – 7 AM (user's timezone)
