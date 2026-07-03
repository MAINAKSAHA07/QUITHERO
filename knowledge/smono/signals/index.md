---
type: SignalIndex
description: Observable behavioral signals the AI monitors during the 5-day learning window and beyond.
---

# Behavioral Signals

These are the data points the AI collects passively during the first 5 days (observation phase) and continues monitoring throughout the program. Each signal has a source (where the data comes from), a meaning (what it tells us), and an action (how it influences personalization).

## Signal Sources

| Signal | PocketBase Source | Collection |
|--------|------------------|------------|
| App open times | `analytics_events` (event_type: 'page_view') | analytics_events |
| Session completion speed | `session_progress.time_spent_minutes` | session_progress |
| Step drop-off point | `session_progress.last_step_index` | session_progress |
| Craving timestamps + triggers | `cravings.created`, `cravings.trigger` | cravings |
| Craving intensity trajectory | `cravings.intensity` over time | cravings |
| Journal mood | `journal_entries.mood` | journal_entries |
| Notification response | `notification_events.opened_at` | notification_events |

## Observation Window

- **Days 1–5**: Pure observation. No personalization active. Build behavioral fingerprint.
- **Day 6+**: Personalization activates. Signals continue updating the profile in real-time.
- **Profile recomputation**: Every 24 hours (cron) or on-demand when AI endpoint is called.
