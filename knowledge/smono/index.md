---
bundle: smono
version: 1.0.0
description: OKF Knowledge Bundle for Smono quit-smoking CBT program
created: 2026-07-03
---

# Smono Knowledge Bundle

This bundle contains the structured knowledge that powers Smono's behavioral AI personalization engine.

## Structure

| Directory | Purpose |
|-----------|---------|
| `program/` | 30-day CBT curriculum (one doc per day) |
| `archetypes/` | 4 user archetype profiles with adaptation rules |
| `signals/` | Observable behavioral signals the AI monitors |
| `content-variants/` | Tone and content adaptation guides per archetype |
| `notifications/` | Message library, timing rules, escalation logic |
| `evaluation/` | Scoring rubrics for AI decision quality |

## Usage

The AI personalization endpoint loads relevant documents from this bundle as direct context before generating personalized content. This is deterministic context loading (not vector RAG) — the user's archetype + day number + trigger type determines which documents are loaded.

## Loading Rules

1. Always load the user's archetype doc
2. Always load the current day's program doc
3. Load signal docs relevant to the trigger (craving spike → craving-patterns.md)
4. Load notification docs when generating notification messages
5. Load evaluation rubrics for quality scoring
