---
type: EvaluationRubric
title: Content Fit Rubric
description: How to score whether personalized content is appropriate for a user.
---

# Content Fit Scoring (0–10)

## Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Archetype alignment | 3 | Does the tone match the user's archetype profile? |
| Day relevance | 2 | Is the content appropriate for this day in the program? |
| Behavioral context | 2 | Does it account for recent signals (craving spike, mood dip)? |
| Length appropriateness | 1 | Is it the right length for this user's engagement pattern? |
| Trauma-informed | 1 | Free of guilt, shame, or stigmatizing language? |
| Actionability | 1 | Does it give the user something concrete to do or think about? |

## Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 8–10 | Excellent fit | Serve to user |
| 6–7 | Acceptable | Serve to user, log for review |
| 4–5 | Poor fit | Regenerate with adjusted prompt |
| 0–3 | Harmful or off-topic | Fall back to static content, flag for review |

## Red Lines (Automatic 0 Score)

- Mentions archetype name or system internals
- Uses guilt or shame framing
- Contradicts CBT program principles
- Exceeds word limit by >50%
- Contains factually incorrect health claims
