---
type: NotificationConcept
title: Timing Rules
description: When to send notifications based on behavioral data.
---

# Notification Timing Strategy

## Scheduled Notifications

The scheduled notification is sent at the user's **best_notification_hour** (from behavior profile). If no profile exists yet (Days 1–5), use the daily_reminder_time from their onboarding settings.

### Computation

```
best_notification_hour = mode(hours where user opened app within 30 min of notification)
fallback = UserProfile.daily_reminder_time
```

## Craving Spike Notifications

Sent immediately when detected. Detection criteria:
- ≥2 cravings logged within a 2-hour window, OR
- A single craving with intensity = 5

## Missed Session Notifications

Sent when:
```
current_time > (user's typical session hour + 4 hours)
AND session_progress for today's day does NOT exist
AND no notification of type 'missed_session' sent today
```

## Slip Recovery Notifications

Sent within 5 minutes of a slip event being logged. Highest priority — overrides cool-down timer (but not night silence).

## Archetype Timing Preferences

| Archetype | Best Window | Avoid |
|-----------|------------|-------|
| Escapist | Evening (7–9 PM) | Early morning |
| Stress Reactor | 30 min pre-stress-peak | During active stress spike |
| Social Mirror | Late afternoon (4–6 PM, before social hours) | During social events |
| Auto-Pilot | 5–10 min before routine smoke time | Random times (breaks routine) |
