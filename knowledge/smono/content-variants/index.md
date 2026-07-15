---
type: ContentVariantIndex
description: Tone and content adaptation rules for each archetype.
---

# Content Variants

Each day's session has a canonical script (static). The AI generates **insertions** — personalized intros, reframes, and reflections — based on the user's archetype. The base content is never replaced; insertions augment it.

## Insertion Types

| Type | Where | Max Length |
|------|-------|-----------|
| Session intro | Before Step 1 | 150 words |
| Module reframe | Before a priority step | 80 words |
| Exercise motivation | Before exercise steps | 60 words |
| Closing reflection | After final step | 100 words |
| Journaling prompt | Custom prompt per archetype | 40 words |

## Rules

1. Insertions must be additive — never contradict the base content
2. Tone must match archetype profile (see individual tone docs)
3. Never mention the archetype name or system internals to the user
4. If user has logged a slip in last 24h, override tone to compassionate regardless of archetype
5. All insertions must be second-person ("you"), present tense — never ask the user as "I" (e.g. not "When did I…"; use "When did you…"). First-person only for optional fill-in stems the user completes ("I used to believe…")
