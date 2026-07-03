---
type: ArchetypeIndex
description: Four user archetypes derived from onboarding triggers and emotional states.
source: frontend/utils/archetypeAssignment.ts
---

# User Archetypes

## Assignment Logic

Archetypes are initially assigned during KYC (onboarding) based on:
- `smoking_triggers[]` — CravingTrigger selections (weight: 3 per match)
- `emotional_states[]` — EmotionalState selections (weight: 1–2 per match)

After 5 days of behavioral observation, the AI may revise the archetype if behavioral data contradicts the self-reported assignment (confidence threshold: 0.75).

## The Four Archetypes

| Archetype | Primary Trigger | Key Emotional States | Tone |
|-----------|----------------|---------------------|------|
| Escapist | Boredom | Bored, Lonely, Sad | Warm, introspective, imagery-rich |
| Stress Reactor | Stress | Stressed, Anxious, Angry | Grounding, tool-focused, immediate |
| Social Mirror | Social | Happy, Excited | Community, identity, belonging |
| Auto-Pilot | Habit | (any/none dominant) | Pattern interruption, routine hacking |

## Revision Rules

```
IF behavioral_archetype ≠ assigned_archetype
   AND archetype_confidence > 0.75
   AND days_observed >= 5:
     → Update quit_archetype silently
     → Re-route content variants
     → Log archetype_revision event
```
