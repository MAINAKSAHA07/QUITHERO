---
type: CBTConcept
title: Functional Analysis — The A→B→C Framework
description: The Antecedent-Belief-Consequence model applied to smoking cessation, for structured journaling and craving analysis.
tags: [cbt, functional-analysis, abc-model]
timestamp: 2026-07-03T00:00:00Z
---

# The A→B→C Framework

## Structure

| Component | Definition | Example |
|-----------|-----------|---------|
| A — Antecedent | The situation/trigger that precedes the urge | "Morning coffee break at work" |
| B — Belief/Thought | The automatic thought that fires | "I always smoke with coffee" |
| C — Consequence | The feeling + behavior that follows | Feeling: craving (6/10) → Behavior: resisted |

## How It Maps to QuitHero Data

- **Antecedent**: `Craving.trigger` + `JournalEntry.antecedent` (CBT mode)
- **Belief/Thought**: `Craving.automatic_thought` + `JournalEntry.automatic_thought`
- **Consequence (Feeling)**: `Craving.intensity` + `JournalEntry.mood`
- **Consequence (Behavior)**: `Craving.resolution_method` + `JournalEntry.behavioral_response`

## Common A→B→C Patterns by Archetype

### Stress Reactor
- A: High-pressure work moment / argument / deadline
- B: "I need this to get through" / "Smoking is my only break"
- C: High intensity (7-9), often resolves via smoking or breathing

### Escapist
- A: Boredom, emptiness, post-meal ritual
- B: "I deserve this" / "There's nothing else to do"
- C: Moderate intensity (5-7), often resolves via distraction

### Social Mirror
- A: Social gathering, peer group smoking, party
- B: "I'll be left out" / "It's awkward without a cigarette"
- C: Social pressure (6-8), often resolves via passing on its own

### Auto-Pilot
- A: Routine cue (car, phone, post-meal)
- B: Minimal conscious thought — "habit loop fires"
- C: Low to moderate intensity (3-5), resolves via distraction

## AI Instructions for A→B→C Analysis

When a user provides all three components (in craving log or CBT journal):
1. Identify which of the 5 core beliefs the automatic thought connects to
2. Check if the consequence matches the archetype pattern
3. Track if the user is developing awareness (naming the thought = progress)
4. Note if resolution methods are diversifying (not always the same one)

When a user provides only the antecedent:
- The thought is likely unconscious — this is common early in the program
- Don't push for the thought; just acknowledge the situation awareness

When a user provides the thought but denies it's irrational:
- This indicates the belief is still strongly held
- engagement_quality likely = "resistant"
- The AI should validate the feeling before gently challenging
