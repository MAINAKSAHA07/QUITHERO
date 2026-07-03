---
type: CBTConcept
title: Cognitive Distortion Detection Signals
description: Common thought patterns in smokers and the text signals that indicate each distortion in open responses and journal entries.
tags: [cbt, cognitive-distortions, ai-detection]
timestamp: 2026-07-03T00:00:00Z
---

# Distortions and Detection Signals

## All-or-Nothing Thinking
- Signals: "never", "always", "every time", "I can't", "impossible", "completely"
- Example: "I can never quit because I've tried so many times"
- Target day: Day 7 (Why Willpower Fails)
- Challenge: Reframe as a spectrum — "You've had periods without smoking before"

## Catastrophizing
- Signals: "terrible", "ruin", "disaster", "can't cope", "falling apart", "everything will"
- Example: "If I have one cigarette everything will fall apart"
- Target day: Day 25 (If You Slip)
- Challenge: One slip is data, not destiny — "What actually happens vs. what you're predicting?"

## Emotional Reasoning
- Signals: "I feel like", "it feels like it helps", "it just does", "I know it sounds wrong but"
- Example: "I know smoking doesn't actually help but it feels like it does"
- Target day: Day 3 (Pleasure Illusion)
- Challenge: Feelings are real but not always accurate evidence — "What does the science say vs what you feel?"

## Mind Reading
- Signals: "they expect me to", "people think", "everyone will", "they'll judge"
- Example: "Everyone at the party will expect me to smoke with them"
- Target day: Day 14 (Other Smokers and Social Pressure)
- Challenge: Check the evidence — "Have you tested this assumption? Most people don't notice or don't care"

## Should Statements
- Signals: "should", "must", "have to", "need to", "ought to"
- Example: "I should be able to quit by now"
- Target day: Day 8 (Nothing to Give Up)
- Challenge: Replace with preference — "I'd like to quit" vs "I must quit or I'm a failure"

## Selective Abstraction (Filtering)
- Signals: Focus on one negative detail while ignoring positives
- Example: "I slipped once this week" (ignoring 6 successful days)
- Target day: Day 20 (Counting the Real Gains)
- Challenge: Zoom out — "What's the full picture of this week?"

## Personalization
- Signals: "it's my fault", "because of me", "I made everyone"
- Example: "My family worries because I can't quit"
- Challenge: External factors exist — addiction is a medical condition, not a character flaw

# AI Detection Rules

When analyzing text:
1. Look for signal words/phrases listed above
2. A single signal word alone is insufficient — look for the pattern around it
3. "I can't" + context of hopelessness = all-or-nothing; "I can't" + factual constraint = not a distortion
4. Weight heavily when the distortion supports an active belief (e.g., emotional reasoning + belief_relaxation > 7)
5. Multiple distortions in one response suggest higher resistance or deeper cognitive entrenchment
6. Surface-level responses with no distortions may indicate disengagement rather than health
