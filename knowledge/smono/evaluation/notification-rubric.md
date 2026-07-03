---
type: EvaluationRubric
title: Notification Quality Rubric
description: How to evaluate AI-generated notification messages.
---

# Notification Quality Scoring (0–10)

## Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Length compliance | 2 | Title ≤60 chars, body ≤120 chars? |
| Archetype tone match | 3 | Does the message style fit the user's archetype? |
| Trigger appropriateness | 2 | Is the message appropriate for the trigger type? |
| Action clarity | 2 | Does the user know what to do after reading? |
| Non-stigmatizing | 1 | Free of guilt, shame, or pressure? |

## Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 8–10 | Send immediately | No review needed |
| 6–7 | Acceptable | Send, log for optimization |
| 4–5 | Suboptimal | Use fallback message from library |
| 0–3 | Harmful | Block, use static fallback, flag |

## Character Limits (Hard Enforcement)

- Title: 60 characters max
- Body: 120 characters max
- Exceeding limits = automatic rejection, truncation attempted

## Slip-Specific Rules

After a slip event, ALL notifications must:
- Use compassionate framing
- Never imply the quit attempt has failed
- Offer a low-effort re-entry action
- Frame the slip as data, not failure
