---
type: BehaviorSignal
title: Notification Response
description: How users respond to different notification types and times reveals optimal communication strategy.
source: notification_events collection
---

# What We Observe

- Open rate by notification type (scheduled, craving_spike, missed_session, slip)
- Time-to-open after notification sent
- Whether notification led to session start (within 30 min)
- Best performing hour for opens
- Message style that gets highest engagement

# What It Tells Us

| Pattern | Interpretation |
|---------|---------------|
| High open rate on scheduled, low on others | Routine-driven — prefers predictability |
| Only opens craving-spike notifications | Uses app reactively — needs proactive engagement |
| Never opens notifications | Either disabled, or message fatigue — reduce frequency |
| Opens but doesn't start session | Notification grabs attention but content doesn't pull — improve CTA |
| Consistent 2-min open time | Notification timing is well-calibrated |

# How It Influences Personalization

1. **Best hour → send time**: Optimize scheduled notification to their proven best hour
2. **Best style → message generation**: If factual messages outperform motivational, bias toward factual
3. **Low open rate → reduce frequency**: Back off to every-other-day to avoid fatigue
4. **High open + no session → CTA improvement**: Make notification body more action-specific
5. **Never opens → channel pivot**: Consider in-app prompts instead of push notifications
