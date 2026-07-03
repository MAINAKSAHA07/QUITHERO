---
type: UserArchetype
title: The Stress Reactor
description: User smokes primarily in response to stress, anxiety, or emotional pressure.
tags: [archetype, stress, anxiety, coping, cbt]
resource: frontend/utils/archetypeAssignment.ts#QuitArchetype.STRESS_REACTOR
triggers: [stress]
emotional_states: [stressed, anxious, angry]
score_weights:
  CravingTrigger.STRESS: 3
  EmotionalState.STRESSED: 2
  EmotionalState.ANXIOUS: 2
  EmotionalState.ANGRY: 1
---

# Overview

The Stress Reactor uses nicotine as a perceived coping mechanism for emotional dysregulation. The belief "smoking calms me down" is the core illusion to dismantle — nicotine actually increases cortisol; relief comes only from ending withdrawal, not from pharmacological calm.

# Content Adaptation

- **Tone**: Grounding, immediate, tool-focused. Avoid abstract or philosophical framing.
- **Priority modules**: Day 4 (Relaxation Myth), Day 17 (Real Stress Toolkit), Day 27 (Emotional Triggers).
- **Craving support**: Lead with breathing exercises before cognitive reframing.
- **Avoid**: Lengthy introspective prompts during high-stress periods (signal: multiple cravings logged in <2 hours).

# Notification Strategy

- Best send window: 30 min before typical stress spike (inferred from craving timestamps).
- Message style: Short, grounding, action-first. "Breathe first. Then decide."
- Avoid: Motivational guilt framing ("You said you wanted to quit…").

# Day-Specific Insertions

| Day | Insertion |
|-----|-----------|
| 4 | Highlight the cortisol research panel — nicotine RAISES stress hormones |
| 17 | Lead with the 5-4-3-2-1 grounding tool before the full toolkit |
| 27 | Unlock the "Trigger Map" exercise first — map stress → cigarette chain |
| 16 | Bad days framing: "stress is information, not an instruction to smoke" |

# Behavioral Signals That Confirm This Archetype

- Cravings cluster during work hours (9–6 PM) or around deadlines
- High-intensity cravings (4–5) logged with STRESS trigger
- Multiple cravings within short windows (<2 hours apart)
- Journal mood frequently STRESSED or ANXIOUS
- Fast session completion (wants quick relief, not deep reflection)
